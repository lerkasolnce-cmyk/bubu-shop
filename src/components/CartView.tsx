"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { cartTotal } from "@/lib/cart";
import type { Product } from "@/lib/types";
import type { Locale } from "@/lib/i18n/shared";
import { pick } from "@/lib/i18n/shared";
import { formatPrice } from "@/lib/currency";

type CartLabels = {
  title: string;
  empty: string;
  emptyCta: string;
  total: string;
  checkout: string;
  remove: string;
  increase: string;
  decrease: string;
};

export default function CartView({
  locale,
  labels,
  rate,
}: {
  locale: Locale;
  labels: CartLabels;
  rate?: number | null;
}) {
  // it-locale price display rule (kept in sync with CheckoutForm):
  // per-line UNIT prices and the GRAND total show € main + ₴ small underneath;
  // line subtotals (qty × price) show € only. UAH is the primary business currency.
  const showEurSub = locale === "it" && !!rate;
  const { items, ready, remove, setQty } = useCart();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!ready || items.length === 0) {
      setProducts([]);
      return;
    }

    let cancelled = false;
    const slugs = items.map((item) => item.slug).join(",");

    fetch(`/api/products?slugs=${encodeURIComponent(slugs)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: Product[]) => {
        if (!cancelled) setProducts(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (!cancelled) setProducts([]);
      });

    return () => {
      cancelled = true;
    };
    // Re-fetch whenever the set of lines (not just qty) changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, items.map((item) => item.slug).join(",")]);

  const productBySlug = useMemo(() => new Map(products.map((p) => [p.slug, p])), [products]);
  const total = useMemo(() => cartTotal(items, products), [items, products]);

  // Avoid a hydration mismatch: render nothing until the client has read localStorage.
  if (!ready) return null;

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg border border-blush/40 bg-white p-10 text-center">
        <p className="text-4xl">🍼</p>
        <p className="text-lg text-ink/70">{labels.empty}</p>
        <Link
          href="/"
          className="rounded-full bg-accent px-5 py-2 text-sm font-bold text-cream transition hover:opacity-90"
        >
          {labels.emptyCta}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">{labels.title}</h1>

      <div className="flex flex-col gap-3">
        {items.map((item) => {
          const product = productBySlug.get(item.slug);
          const name = product ? pick(product, "name", locale) : item.slug;
          const image = product?.images?.[0];
          const price = product?.price ?? 0;

          return (
            <div
              key={item.slug}
              className="flex flex-wrap items-center gap-3 rounded-lg border border-blush/40 bg-white p-3 sm:flex-nowrap sm:gap-4"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-cream">
                {image ? (
                  <Image src={image} alt={name} fill sizes="64px" className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl">🛒</div>
                )}
              </div>

              <div className="min-w-0 flex-1 basis-full sm:basis-auto">
                <p className="truncate text-sm font-semibold text-ink">{name}</p>
                <p className="text-sm text-ink/60">{formatPrice(price, locale, rate ?? undefined)}</p>
                {showEurSub && <p className="text-xs text-ink/40">{formatPrice(price, "ua")}</p>}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label={labels.decrease}
                  onClick={() => setQty(item.slug, item.qty - 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-ink/20 text-ink hover:bg-blush/40"
                >
                  −
                </button>
                <span className="w-6 text-center text-sm font-semibold text-ink">{item.qty}</span>
                <button
                  type="button"
                  aria-label={labels.increase}
                  onClick={() => setQty(item.slug, item.qty + 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-ink/20 text-ink hover:bg-blush/40"
                >
                  +
                </button>
              </div>

              <div className="w-20 shrink-0 text-right text-sm font-extrabold text-ink">
                {formatPrice(price * item.qty, locale, rate ?? undefined)}
              </div>

              <button
                type="button"
                onClick={() => remove(item.slug)}
                className="shrink-0 text-xs font-semibold text-ink/50 hover:text-accent"
              >
                {labels.remove}
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between rounded-lg border border-blush/40 bg-white p-4">
        <span className="text-base font-semibold text-ink">{labels.total}</span>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-xl font-extrabold text-ink">{formatPrice(total, locale, rate ?? undefined)}</span>
          {showEurSub && <span className="text-xs text-ink/50">{formatPrice(total, "ua")}</span>}
        </div>
      </div>

      <Link
        href="/checkout"
        className="rounded-full bg-accent px-5 py-3 text-center text-sm font-bold text-cream transition hover:opacity-90"
      >
        {labels.checkout}
      </Link>
    </div>
  );
}
