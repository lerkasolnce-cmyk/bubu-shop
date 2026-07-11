import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getLocale, getT, pick } from "@/lib/i18n";
import { getEurRate } from "@/lib/currency";
import { createServerClient } from "@/lib/supabase/server";
import { fetchProducts, fetchBrands, parseQueryFromSearchParams, buildHref, pluralKey, PAGE_SIZE } from "@/lib/catalog";
import type { Category } from "@/lib/types";
import type { SortKey } from "@/lib/catalog";
import { demoCategories, isDemoMode } from "@/lib/demo";
import ProductCard from "@/components/ProductCard";
import Filters from "@/components/Filters";
import SortSelect from "@/components/SortSelect";
import Pagination from "@/components/Pagination";

async function getCategoryBySlug(slug: string): Promise<Category | null> {
  if (isDemoMode()) return demoCategories.find((c) => c.slug === slug) ?? null;

  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase.from("categories").select("*").eq("slug", slug).maybeSingle();
    if (error || !data) return null;
    return data as Category;
  } catch {
    return null;
  }
}

function humanizeSlug(slug: string): string {
  return slug.replace(/-/g, " ");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  const locale = await getLocale();
  const title = category ? pick(category, "name", locale) : humanizeSlug(slug);

  return { title };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const hasEnv = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

  const category = await getCategoryBySlug(slug);
  if (!category && hasEnv) notFound();

  const locale = await getLocale();
  const t = getT(locale);

  const parsed = parseQueryFromSearchParams(sp);
  const [{ items, total }, brands, rate] = await Promise.all([
    fetchProducts({ ...parsed, categoryId: category?.id }),
    fetchBrands(category?.id),
    locale === "it" ? getEurRate() : Promise.resolve(null),
  ]);

  const basePath = `/catalog/${slug}`;
  const title = category ? pick(category, "name", locale) : humanizeSlug(slug);

  const sortLabels: Record<SortKey, string> = {
    new: t("catalog.sortNewest"),
    price_asc: t("catalog.sortPriceAsc"),
    price_desc: t("catalog.sortPriceDesc"),
    hits: t("catalog.sortPopular"),
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">{title}</h1>
      <p className="mt-1 text-sm text-ink/60">
        {total} {t(`category.products${pluralKey(total)}`)}
      </p>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-start">
        <aside className="lg:w-64 lg:shrink-0">
          <Filters
            brands={brands}
            initial={{
              brands: parsed.brands ?? [],
              minPrice: parsed.minPrice,
              maxPrice: parsed.maxPrice,
              inStockOnly: parsed.inStockOnly ?? false,
            }}
            basePath={basePath}
            labels={{
              filters: t("catalog.filters"),
              brand: t("catalog.brand"),
              price: t("catalog.price"),
              priceFrom: t("catalog.priceFrom"),
              priceTo: t("catalog.priceTo"),
              inStockOnly: t("catalog.inStockOnly"),
              apply: t("catalog.apply"),
              reset: t("catalog.reset"),
            }}
          />
        </aside>

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex justify-end">
            <SortSelect value={parsed.sort} basePath={basePath} labels={sortLabels} />
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-blush/40 bg-white p-10 text-center">
              <p className="text-ink/70">{t("catalog.notFound")}</p>
              <Link href={basePath} className="text-sm font-semibold text-accent underline underline-offset-2">
                {t("catalog.reset")}
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((product) => (
                  <ProductCard key={product.id} product={product} locale={locale} t={t} rate={rate} />
                ))}
              </div>
              <Pagination
                total={total}
                page={parsed.page}
                pageSize={PAGE_SIZE}
                makeHref={(page) => buildHref(basePath, sp, { page: page > 1 ? String(page) : undefined })}
                prevLabel={t("catalog.prev")}
                nextLabel={t("catalog.next")}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
