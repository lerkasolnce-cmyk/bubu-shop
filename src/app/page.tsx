import { getLocale, getT, pick } from "@/lib/i18n";
import { createServerClient } from "@/lib/supabase/server";
import type { Category, Product } from "@/lib/types";
import Hero from "@/components/Hero";
import CategoryGrid from "@/components/CategoryGrid";
import ProductRow from "@/components/ProductRow";
import BrandStrip from "@/components/BrandStrip";
import Advantages from "@/components/Advantages";

async function getHitProducts(): Promise<Product[]> {
  // Supabase project may not exist yet (no env) — fail soft, render without this section.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];

  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_hit", true)
      .limit(8);

    if (error || !data) return [];
    return data as Product[];
  } catch {
    return [];
  }
}

async function getSaleProducts(): Promise<Product[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];

  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_sale", true)
      .limit(8);

    if (error || !data) return [];
    return data as Product[];
  } catch {
    return [];
  }
}

async function getCategoriesWithCounts(): Promise<(Category & { count: number })[]> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return [];

  try {
    const supabase = await createServerClient();
    const { data: categories, error } = await supabase
      .from("categories")
      .select("*")
      .is("parent_id", null)
      .order("sort", { ascending: true });

    if (error || !categories) return [];

    // N=5 categories — per-category count queries are simple and fine here.
    const counts = await Promise.all(
      categories.map(async (cat) => {
        const { count } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("category_id", cat.id);
        return count ?? 0;
      })
    );

    return categories.map((cat, i) => ({ ...cat, count: counts[i] })) as (Category & { count: number })[];
  } catch {
    return [];
  }
}

export default async function Home() {
  const locale = await getLocale();
  const t = getT(locale);

  const [hits, sale, categories] = await Promise.all([
    getHitProducts(),
    getSaleProducts(),
    getCategoriesWithCounts(),
  ]);

  const categoryCards = categories.map((cat) => ({
    slug: cat.slug,
    name: pick(cat, "name", locale),
    count: cat.count,
  }));

  return (
    <div className="flex flex-col gap-12 pb-12">
      <Hero t={t} />
      <CategoryGrid categories={categoryCards} t={t} />
      <ProductRow title={t("home.hits")} products={hits} locale={locale} t={t} />
      <ProductRow title={t("home.sale")} products={sale} locale={locale} t={t} />
      <BrandStrip />
      <Advantages t={t} />
    </div>
  );
}
