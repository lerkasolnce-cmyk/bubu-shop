import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getLocale, getT, pick } from "@/lib/i18n";
import { categoryName } from "@/lib/categories-i18n";
import { discountPercent, formatPrice, getEurRate } from "@/lib/currency";
import { createServerClient } from "@/lib/supabase/server";
import { demoCategories, demoProducts, isDemoMode } from "@/lib/demo";
import type { Category, Product } from "@/lib/types";
import Gallery from "@/components/Gallery";
import SpecsTable from "@/components/SpecsTable";
import ProductRow from "@/components/ProductRow";
import BuyBox from "@/components/BuyBox";
import ProductTabs from "@/components/ProductTabs";

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

/** Fetches a category by id (not slug — product.category_id is a category id). Fail-soft -> null. */
async function getCategoryById(id: string): Promise<Category | null> {
  if (isDemoMode()) return demoCategories.find((c) => c.id === id) ?? null;

  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase.from("categories").select("*").eq("id", id).maybeSingle();
    if (error || !data) return null;
    return data as Category;
  } catch {
    return null;
  }
}

/** Breadcrumb trail: Home -> root category (if any) -> leaf category -> product name. Fail-soft. */
async function getBreadcrumbCategories(
  categoryId: string | null
): Promise<{ leaf: Category | null; root: Category | null }> {
  if (!categoryId) return { leaf: null, root: null };

  const leaf = await getCategoryById(categoryId);
  if (!leaf) return { leaf: null, root: null };
  if (!leaf.parent_id) return { leaf, root: null };

  const root = await getCategoryById(leaf.parent_id);
  return { leaf, root };
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
  const hasSpecs = Object.keys(product.specs ?? {}).length > 0;
  const [similar, rate, { leaf: leafCategory, root: rootCategory }] = await Promise.all([
    getSimilarProducts(product.category_id, product.slug),
    locale === "it" ? getEurRate() : Promise.resolve(null),
    getBreadcrumbCategories(product.category_id),
  ]);

  const showEurSub = locale === "it" && !!rate;
  const priceMain = formatPrice(product.price, locale, rate ?? undefined);
  const oldPriceMain =
    product.old_price != null ? formatPrice(product.old_price, locale, rate ?? undefined) : null;
  const discountPct = discountPercent(product.price, product.old_price);

  const isOutOfStock = product.stock_status === "out_of_stock";
  const stockLabel =
    product.stock_status === "in_stock"
      ? t("product.inStock")
      : product.stock_status === "preorder"
        ? t("product.preorder")
        : t("product.outOfStock");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1.5 text-sm text-ink/50">
        <Link href="/" className="hover:text-ink hover:underline">
          {t("breadcrumbs.home")}
        </Link>
        {rootCategory && (
          <>
            <span aria-hidden="true">/</span>
            <Link href={`/catalog/${rootCategory.slug}`} className="hover:text-ink hover:underline">
              {categoryName(rootCategory, locale)}
            </Link>
          </>
        )}
        {leafCategory && (
          <>
            <span aria-hidden="true">/</span>
            <Link href={`/catalog/${leafCategory.slug}`} className="hover:text-ink hover:underline">
              {categoryName(leafCategory, locale)}
            </Link>
          </>
        )}
        <span aria-hidden="true">/</span>
        <span className="text-ink/70" aria-current="page">
          {name}
        </span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* key: reset Gallery's active-thumbnail state on client-side navigation between products */}
        <Gallery key={product.slug} images={product.images} alt={name} />

        <div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <div>
            {product.brand && (
              <span className="text-xs font-semibold uppercase tracking-wide text-ink/50">{product.brand}</span>
            )}
            <h1 className="mt-1 text-2xl font-extrabold text-ink sm:text-3xl">{name}</h1>
            <p className="mt-1 text-xs font-medium text-ink/40">
              {t("product.sku")}: {product.slug.toUpperCase()}
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-baseline gap-3">
              <span className={`text-3xl font-extrabold ${product.old_price != null ? "text-accent" : "text-ink"}`}>
                {priceMain}
              </span>
              {oldPriceMain != null && <span className="text-lg text-ink/40 line-through">{oldPriceMain}</span>}
              {discountPct != null && (
                <span className="rounded-full bg-accent px-2.5 py-0.5 text-xs font-extrabold text-cream">
                  -{discountPct}%
                </span>
              )}
            </div>
            {showEurSub && <span className="text-sm text-ink/50">{formatPrice(product.price, "ua")}</span>}
          </div>

          <span className="flex items-center gap-1.5 text-sm font-medium text-ink/60">
            <span className={`h-2 w-2 rounded-full ${STOCK_DOT[product.stock_status]}`} />
            {stockLabel}
          </span>

          <BuyBox
            slug={product.slug}
            disabled={isOutOfStock}
            labels={{
              addToCart: t("common.addToCart"),
              buyNow: t("common.buyNow"),
              decreaseQty: t("cart.decrease"),
              increaseQty: t("cart.increase"),
            }}
          />

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="flex flex-col gap-1 rounded-lg border border-blush/40 bg-white p-3 text-xs text-ink/70">
              <span className="text-lg">🚚</span>
              {t("product.trustDelivery")}
            </div>
            <div className="flex flex-col gap-1 rounded-lg border border-blush/40 bg-white p-3 text-xs text-ink/70">
              <span className="text-lg">🛡️</span>
              {t("product.trustWarranty")}
            </div>
            <div className="flex flex-col gap-1 rounded-lg border border-blush/40 bg-white p-3 text-xs text-ink/70">
              <span className="text-lg">↩️</span>
              {t("product.trustReturns")}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 flex flex-col gap-10">
        <ProductTabs
          description={description || undefined}
          descriptionLabel={t("product.description")}
          specs={hasSpecs ? <SpecsTable specs={product.specs} title="" /> : undefined}
          specsLabel={t("product.specs")}
        />
      </div>

      <div className="mt-12">
        <ProductRow title={t("product.similar")} products={similar} locale={locale} t={t} rate={rate} />
      </div>
    </div>
  );
}
