import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import type { Locale } from "@/lib/i18n";
import { pick } from "@/lib/i18n";
import AddToCartButton from "./AddToCartButton";

function StrollerPlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-cream">
      <svg viewBox="0 0 64 64" className="h-16 w-16 text-ink/25" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 30c0-10 7-18 16-18 8 0 13 5 15 12" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 30h38l-3 8a6 6 0 0 1-5.7 4H20a6 6 0 0 1-5.8-4.5L12 30Z" />
        <circle cx="20" cy="48" r="4" />
        <circle cx="42" cy="48" r="4" />
        <path strokeLinecap="round" d="M45 12l6-4" />
      </svg>
    </div>
  );
}

const STOCK_DOT: Record<Product["stock_status"], string> = {
  in_stock: "bg-mint",
  preorder: "bg-accent",
  out_of_stock: "bg-ink/30",
};

export default function ProductCard({
  product,
  locale,
  t,
}: {
  product: Product;
  locale: Locale;
  t: (key: string) => string;
}) {
  const name = pick(product, "name", locale);
  const image = product.images?.[0];
  const isOutOfStock = product.stock_status === "out_of_stock";
  const stockLabel =
    product.stock_status === "in_stock"
      ? t("product.inStock")
      : product.stock_status === "preorder"
        ? t("product.preorder")
        : t("product.outOfStock");

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-blush/40 bg-white transition hover:shadow-md">
      <Link href={`/product/${product.slug}`} className="flex flex-1 flex-col">
        <div className="relative aspect-square">
          {(product.is_hit || product.is_sale) && (
            <div className="absolute left-2 top-2 z-10 flex flex-col gap-1">
              {product.is_hit && (
                <span className="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-cream">
                  {t("badge.hit")}
                </span>
              )}
              {product.is_sale && (
                <span className="rounded-full bg-mint px-2 py-0.5 text-xs font-bold text-ink">
                  {t("badge.sale")}
                </span>
              )}
            </div>
          )}
          {image ? (
            <Image
              src={image}
              alt={name}
              fill
              sizes="(min-width: 1024px) 22vw, 45vw"
              className="object-cover"
            />
          ) : (
            <StrollerPlaceholder />
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1 p-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-ink/50">{product.brand}</span>
          <h3 className="line-clamp-2 text-sm font-semibold text-ink">{name}</h3>
          <div className="mt-auto flex items-baseline gap-2 pt-1">
            <span className="text-lg font-extrabold text-ink">₴{product.price.toLocaleString("uk-UA")}</span>
            {product.old_price != null && (
              <span className="text-sm text-ink/40 line-through">
                ₴{product.old_price.toLocaleString("uk-UA")}
              </span>
            )}
          </div>
          <span className="flex items-center gap-1.5 text-xs font-medium text-ink/60">
            <span className={`h-1.5 w-1.5 rounded-full ${STOCK_DOT[product.stock_status]}`} />
            {stockLabel}
          </span>
        </div>
      </Link>
      <div className="p-3 pt-0">
        <AddToCartButton slug={product.slug} label={t("common.addToCart")} disabled={isOutOfStock} />
      </div>
    </div>
  );
}
