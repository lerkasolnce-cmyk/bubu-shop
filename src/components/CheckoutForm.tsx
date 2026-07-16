"use client";

import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { cartTotal } from "@/lib/cart";
import { orderSchema } from "@/lib/order-schema";
import type { Product } from "@/lib/types";
import type { Locale } from "@/lib/i18n/shared";
import { pick } from "@/lib/i18n/shared";
import { formatPrice } from "@/lib/currency";
import NpDeliveryFields from "@/components/NpDeliveryFields";

export type CheckoutLabels = {
  title: string;
  name: string;
  phone: string;
  city: string;
  npOffice: string;
  cityNoResults: string;
  officeNoResults: string;
  officeSearchPlaceholder: string;
  loading: string;
  comment: string;
  paymentTitle: string;
  paymentMono: string;
  paymentCod: string;
  submit: string;
  submitting: string;
  summaryTitle: string;
  total: string;
  empty: string;
  emptyCta: string;
  errorRequired: string;
  errorPhone: string;
  errorSubmit: string;
  errorOutOfStock: string;
  errorUnknownProduct: string;
};

type FieldErrors = Partial<Record<"name" | "phone" | "city", string>>;

/** Strips everything but digits and drops a leading 0/380 the user may paste/type. */
function normalizePhoneDigits(raw: string): string {
  const digitsOnly = raw.replace(/\D/g, "");
  const trimmed = digitsOnly.startsWith("380")
    ? digitsOnly.slice(3)
    : digitsOnly.startsWith("0")
      ? digitsOnly.slice(1)
      : digitsOnly;
  return trimmed.slice(0, 9);
}

/**
 * Italian numbers: digits only, max 11. The leading 0 is kept (landlines carry
 * it even in international format), and a pasted "39" country code is stripped
 * only when the number is too long to be a national one — mobile prefixes like
 * 393 are otherwise legitimate leading digits.
 */
function normalizeItPhoneDigits(raw: string): string {
  let digitsOnly = raw.replace(/\D/g, "");
  if (digitsOnly.startsWith("39") && digitsOnly.length > 11) {
    digitsOnly = digitsOnly.slice(2);
  }
  return digitsOnly.slice(0, 11);
}

export default function CheckoutForm({
  locale,
  labels,
  rate,
}: {
  locale: Locale;
  labels: CheckoutLabels;
  rate?: number | null;
}) {
  const router = useRouter();
  const { items, ready, clear } = useCart();
  // it-locale checkout ships to Italy: plain address fields instead of the
  // Nova Poshta pickers, and a +39 phone instead of +380.
  const isItaly = locale === "it";
  const phonePrefix = isItaly ? "+39" : "+380";
  // it-locale price display rule (kept in sync with CartView):
  // per-line UNIT prices and the GRAND total show € main + ₴ small underneath;
  // line subtotals (qty × price) show € only. This summary lists only line
  // subtotals + the grand total, so only the grand total carries the ₴ sub.
  const showEurSub = locale === "it" && !!rate;

  const [products, setProducts] = useState<Product[]>([]);
  const [name, setName] = useState("");
  const [phoneDigits, setPhoneDigits] = useState("");
  const [city, setCity] = useState("");
  const [npOffice, setNpOffice] = useState("");
  const [comment, setComment] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "mono">("cod");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  // Once true, keeps the empty-cart redirect from flashing between clear() and navigation.
  const [submitted, setSubmitted] = useState(false);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, items.map((item) => item.slug).join(",")]);

  const productBySlug = useMemo(() => new Map(products.map((p) => [p.slug, p])), [products]);
  const total = useMemo(() => cartTotal(items, products), [items, products]);

  if (!ready) return null;

  if (items.length === 0 && !submitted) {
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

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (pending) return;

    const parsed = orderSchema.safeParse({
      customer: { name, phone: `${phonePrefix}${phoneDigits}`, city, npOffice, comment },
      items,
      paymentMethod,
      locale,
    });

    if (!parsed.success) {
      const fieldErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[1];
        if (field === "name") fieldErrors.name = labels.errorRequired;
        if (field === "phone") fieldErrors.phone = labels.errorPhone;
        if (field === "city") fieldErrors.city = labels.errorRequired;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setSubmitError(null);
    setPending(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = await res.json().catch(() => null);

      if (!res.ok || !data) {
        // The API returns machine codes, never user-facing prose — map known
        // codes to localized copy; anything unmapped falls back to the generic error.
        const code = data && typeof data.error === "string" ? data.error : "";
        const codeLabels: Record<string, string> = {
          out_of_stock: labels.errorOutOfStock,
          unknown_product: labels.errorUnknownProduct,
        };
        setSubmitError(codeLabels[code] ?? labels.errorSubmit);
        setPending(false);
        return;
      }

      setSubmitted(true);
      clear();
      if (data.payUrl) {
        window.location.href = data.payUrl;
      } else {
        router.push(`/order/${data.orderId}/thanks`);
      }
    } catch {
      setSubmitError(labels.errorSubmit);
      setPending(false);
    }
  }

  const inputCls =
    "w-full min-w-0 rounded-md border border-blush/60 bg-cream px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-accent focus:outline-none";
  const errorCls = "mt-1 text-xs font-medium text-red-600";

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">{labels.title}</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-ink">{labels.name}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
              autoComplete="name"
            />
            {errors.name && <p className={errorCls}>{errors.name}</p>}
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-ink">{labels.phone}</label>
            <div className="flex items-center gap-2">
              <span className="shrink-0 rounded-md border border-blush/60 bg-cream px-3 py-2 text-sm font-semibold text-ink/70">
                {phonePrefix}
              </span>
              <input
                type="tel"
                inputMode="numeric"
                value={phoneDigits}
                onChange={(e) =>
                  setPhoneDigits(
                    isItaly ? normalizeItPhoneDigits(e.target.value) : normalizePhoneDigits(e.target.value)
                  )
                }
                placeholder={isItaly ? "XXX XXXXXXX" : "XXXXXXXXX"}
                className={inputCls}
                autoComplete="tel-national"
              />
            </div>
            {errors.phone && <p className={errorCls}>{errors.phone}</p>}
          </div>

          {isItaly ? (
            <>
              <div>
                <label className="mb-1 block text-sm font-semibold text-ink">{labels.city}</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={inputCls}
                  autoComplete="address-level2"
                />
                {errors.city && <p className={errorCls}>{errors.city}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-ink">{labels.npOffice}</label>
                <input
                  type="text"
                  value={npOffice}
                  onChange={(e) => setNpOffice(e.target.value)}
                  className={inputCls}
                  autoComplete="street-address"
                />
              </div>
            </>
          ) : (
            <NpDeliveryFields
              locale={locale}
              labels={{
                city: labels.city,
                npOffice: labels.npOffice,
                cityNoResults: labels.cityNoResults,
                officeNoResults: labels.officeNoResults,
                officeSearchPlaceholder: labels.officeSearchPlaceholder,
                loading: labels.loading,
              }}
              city={city}
              onCityChange={setCity}
              npOffice={npOffice}
              onNpOfficeChange={setNpOffice}
              cityError={errors.city}
              inputCls={inputCls}
              errorCls={errorCls}
            />
          )}

          <div>
            <label className="mb-1 block text-sm font-semibold text-ink">{labels.comment}</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className={inputCls}
            />
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-ink">{labels.paymentTitle}</p>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm text-ink/80">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cod"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                  className="h-4 w-4 accent-accent"
                />
                {labels.paymentCod}
              </label>
              <label className="flex items-center gap-2 text-sm text-ink/80">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="mono"
                  checked={paymentMethod === "mono"}
                  onChange={() => setPaymentMethod("mono")}
                  className="h-4 w-4 accent-accent"
                />
                {labels.paymentMono}
              </label>
            </div>
          </div>

          {submitError && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {submitError}
            </div>
          )}

          <button
            type="submit"
            disabled={pending}
            className={
              pending
                ? "cursor-not-allowed rounded-full bg-ink/20 px-5 py-3 text-sm font-bold text-cream"
                : "rounded-full bg-accent px-5 py-3 text-sm font-bold text-cream transition hover:opacity-90"
            }
          >
            {pending ? labels.submitting : labels.submit}
          </button>
        </form>

        <aside className="flex h-fit flex-col gap-3 rounded-lg border border-blush/40 bg-white p-4">
          <h2 className="text-base font-extrabold text-ink">{labels.summaryTitle}</h2>
          <div className="flex flex-col gap-2">
            {items.map((item) => {
              const product = productBySlug.get(item.slug);
              const name = product ? pick(product, "name", locale) : item.slug;
              const price = product?.price ?? 0;
              return (
                <div key={item.slug} className="flex items-start justify-between gap-2 text-sm">
                  <span className="text-ink/70">
                    {name} × {item.qty}
                  </span>
                  <span className="shrink-0 font-semibold text-ink">
                    {formatPrice(price * item.qty, locale, rate ?? undefined)}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between border-t border-blush/40 pt-3">
            <span className="text-sm font-semibold text-ink">{labels.total}</span>
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-lg font-extrabold text-ink">{formatPrice(total, locale, rate ?? undefined)}</span>
              {showEurSub && <span className="text-xs text-ink/50">{formatPrice(total, "ua")}</span>}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
