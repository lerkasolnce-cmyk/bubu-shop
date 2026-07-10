import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getLocale, getT, pick } from "@/lib/i18n";
import { createServerClient } from "@/lib/supabase/server";
import { demoProducts, isDemoMode } from "@/lib/demo";
import type { Product } from "@/lib/types";
import Gallery from "@/components/Gallery";
import SpecsTable from "@/components/SpecsTable";
import AddToCartButton from "@/components/AddToCartButton";
import BuyNowButton from "@/components/BuyNowButton";
import ProductRow from "@/components/ProductRow";

// cache(): generateMetadata and the page both need the product — dedupe to one fetch per request.
const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  if (isDemoMode()) return demoProducts.find((p) => p.slug === slug) ?? null;

  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase.from("products").select("*").eq("slug", slug).maybeSingle();
    if (error || !data) return null;
    return data as Product;
  } catch {
    return null;
  }
});

/** 4 products from the same category, excluding the current one. Fail-soft -> []. */
async function getSimilarProducts(categoryId: string | null, excludeSlug: string): Promise<Product[]> {
  if (!categoryId) return [];

  if (isDemoMode()) {
    return demoProducts.filter((p) => p.category_id === categoryId && p.slug !== excludeSlug).slice(0, 4);
  }

  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("category_id", categoryId)
      .neq("slug", excludeSlug)
      .limit(4);
    if (error || !data) return [];
    return data as Product[];
  } catch {
    return [];
  }
}

const STOCK_DOT: Record<Product["stock_status"], string> = {
  in_stock: "bg-mint",
  preorder: "bg-accent",
  out_of_stock: "bg-ink/30",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const locale = await getLocale();
  const name = pick(product, "name", locale);
  const description = pick(product, "description", locale).slice(0, 150);

  return {
    title: name,
    description,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const locale = await getLocale();
  const t = getT(locale);

  const name = pick(product, "name", locale);
  const description = pick(product, "description", locale);
  const similar = await getSimilarProducts(product.category_id, product.slug);

  const isOutOfStock = product.stock_status === "out_of_stock";
  const stockLabel =
    product.stock_status === "in_stock"
      ? t("product.inStock")
      : product.stock_status === "preorder"
        ? t("product.preorder")
        : t("product.outOfStock");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* key: reset Gallery's active-thumbnail state on client-side navigation between products */}
        <Gallery key={product.slug} images={product.images} alt={name} />

        <div className="flex flex-col gap-4">
          <div>
            {product.brand && (
              <span className="text-xs font-semibold uppercase tracking-wide text-ink/50">{product.brand}</span>
            )}
            <h1 className="mt-1 text-2xl font-extrabold text-ink sm:text-3xl">{name}</h1>
          </div>

          <div className="flex items-baseline gap-3">
            <span className={`text-3xl font-extrabold ${product.old_price != null ? "text-accent" : "text-ink"}`}>
              ₴{product.price.toLocaleString("uk-UA")}
            </span>
            {product.old_price != null && (
              <span className="text-lg text-ink/40 line-through">
                ₴{product.old_price.toLocaleString("uk-UA")}
              </span>
            )}
          </div>

          <span className="flex items-center gap-1.5 text-sm font-medium text-ink/60">
            <span className={`h-2 w-2 rounded-full ${STOCK_DOT[product.stock_status]}`} />
            {stockLabel}
          </span>

          <div className="flex flex-col gap-2 sm:flex-row">
            <AddToCartButton slug={product.slug} label={t("common.addToCart")} disabled={isOutOfStock} />
            <BuyNowButton slug={product.slug} label={t("common.buyNow")} disabled={isOutOfStock} />
          </div>

          <div className="flex flex-col gap-1.5 rounded-lg border border-blush/40 bg-white p-4 text-sm text-ink/70">
            <p>🚚 {t("product.freeDelivery")}</p>
            <p>🛡️ {t("product.warranty")}</p>
          </div>
        </div>
      </div>

      <div className="mt-12 flex flex-col gap-10">
        {description && (
          <section>
            <h2 className="mb-3 text-xl font-extrabold text-ink sm:text-2xl">{t("product.description")}</h2>
            <p className="whitespace-pre-line text-ink/80">{description}</p>
          </section>
        )}

        <SpecsTable specs={product.specs} title={t("product.specs")} />
      </div>

      <div className="mt-12">
        <ProductRow title={t("product.similar")} products={similar} locale={locale} t={t} />
      </div>
    </div>
  );
}
