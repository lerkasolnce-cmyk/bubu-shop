import type { MetadataRoute } from "next";
import { createServerClient } from "@/lib/supabase/server";
import { demoCategories, demoProducts, isDemoMode } from "@/lib/demo";
import type { Category, Product } from "@/lib/types";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

/** All categories for the sitemap. Fail-soft -> [] (never throws, never breaks the build). */
async function getCategories(): Promise<Pick<Category, "slug">[]> {
  if (isDemoMode()) return demoCategories;

  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase.from("categories").select("slug");
    if (error || !data) return [];
    return data as Pick<Category, "slug">[];
  } catch {
    return [];
  }
}

/** All products for the sitemap. Fail-soft -> []. */
async function getProducts(): Promise<Pick<Product, "slug" | "created_at">[]> {
  if (isDemoMode()) return demoProducts.map((p) => ({ slug: p.slug, created_at: p.created_at }));

  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase.from("products").select("slug, created_at");
    if (error || !data) return [];
    return data as Pick<Product, "slug" | "created_at">[];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([getCategories(), getProducts()]);

  const staticEntries: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/delivery`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${BASE_URL}/about`, changeFrequency: "yearly", priority: 0.4 },
    { url: `${BASE_URL}/contacts`, changeFrequency: "yearly", priority: 0.4 },
  ];

  const categoryEntries: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${BASE_URL}/catalog/${cat.slug}`,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: `${BASE_URL}/product/${product.slug}`,
    lastModified: product.created_at ? new Date(product.created_at) : undefined,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticEntries, ...categoryEntries, ...productEntries];
}
