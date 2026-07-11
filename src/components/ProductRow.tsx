import type { Product } from "@/lib/types";
import type { Locale } from "@/lib/i18n";
import ProductCard from "./ProductCard";

export default function ProductRow({
  title,
  products,
  locale,
  t,
  rate,
}: {
  title: string;
  products: Product[];
  locale: Locale;
  t: (key: string) => string;
  rate?: number | null;
}) {
  // Fail-soft: no data (no DB yet, or empty result) → skip the section entirely.
  if (products.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-6xl px-4">
      <h2 className="mb-4 text-xl font-extrabold text-ink sm:text-2xl">{title}</h2>
      <div className="scrollbar-hide -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
        {products.map((product) => (
          <div key={product.id} className="w-[46%] shrink-0 snap-start sm:w-[220px] lg:w-auto">
            <ProductCard product={product} locale={locale} t={t} rate={rate} />
          </div>
        ))}
      </div>
    </section>
  );
}
