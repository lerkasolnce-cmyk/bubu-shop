import type { Metadata } from "next";
import { getLocale, getT } from "@/lib/i18n";
import { fetchProducts, parseQueryFromSearchParams, buildHref, pluralKey, PAGE_SIZE } from "@/lib/catalog";
import type { SortKey } from "@/lib/catalog";
import ProductCard from "@/components/ProductCard";
import SortSelect from "@/components/SortSelect";
import Pagination from "@/components/Pagination";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const locale = await getLocale();
  const t = getT(locale);
  const q = typeof sp.q === "string" ? sp.q.trim() : undefined;

  return { title: q ? `${t("search.resultsFor")}: ${q}` : t("search.title") };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const locale = await getLocale();
  const t = getT(locale);

  const parsed = parseQueryFromSearchParams(sp);
  const { items, total } = await fetchProducts(parsed);

  const basePath = "/search";
  const sortLabels: Record<SortKey, string> = {
    new: t("catalog.sortNewest"),
    price_asc: t("catalog.sortPriceAsc"),
    price_desc: t("catalog.sortPriceDesc"),
    hits: t("catalog.sortPopular"),
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">
        {parsed.q ? `${t("search.resultsFor")}: “${parsed.q}”` : t("search.title")}
      </h1>
      <p className="mt-1 text-sm text-ink/60">
        {total} {t(`category.products${pluralKey(total)}`)}
      </p>

      <div className="mt-6">
        <div className="mb-4 flex justify-end">
          <SortSelect value={parsed.sort} basePath={basePath} labels={sortLabels} />
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-blush/40 bg-white p-10 text-center">
            <p className="text-ink/70">{t("catalog.notFound")}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((product) => (
                <ProductCard key={product.id} product={product} locale={locale} t={t} />
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
  );
}
