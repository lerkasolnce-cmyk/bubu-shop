import Link from "next/link";
import { z } from "zod";
import { getLocale, getT } from "@/lib/i18n";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDemoMode } from "@/lib/demo";
import { formatPrice } from "@/lib/currency";

// orders.id is a bigint identity — positive int, never a uuid.
const idSchema = z.coerce.number().int().positive();

type OrderSummary = {
  id: number;
  total: number;
  total_eur: number | null;
  eur_rate: number | null;
};

/**
 * Loads the amount summary for the thanks page. The customer has no session
 * and RLS blocks public reads of `orders`, so this uses the admin client —
 * strictly server-side, and only the harmless summary columns are selected.
 * Fail-soft → null: demo mode, bad id, missing order, or a DB error all fall
 * back to the generic thanks page (never a 404 — the order may still exist).
 */
async function loadOrderSummary(idRaw: string): Promise<OrderSummary | null> {
  if (isDemoMode()) return null;

  const parsedId = idSchema.safeParse(idRaw);
  if (!parsedId.success) return null;

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("orders")
      .select("id,total,total_eur,eur_rate")
      .eq("id", parsedId.data)
      .maybeSingle();
    if (error || !data) return null;
    return data as OrderSummary;
  } catch {
    return null;
  }
}

export default async function OrderThanksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getLocale();
  const t = getT(locale);
  const order = await loadOrderSummary(id);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-4 px-4 py-16 text-center">
      <p className="text-5xl">🎉</p>
      <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">{t("order.thanksTitle")}</h1>
      <p className="text-base font-semibold text-ink/80">
        {t("order.thanksNumber")} №{id}
      </p>

      {order && (
        <div className="flex flex-col items-center gap-0.5">
          <p className="text-base font-semibold text-ink">
            {t("order.totalLabel")}: {formatPrice(order.total, "ua")}
          </p>
          {order.total_eur != null && order.eur_rate != null && (
            <p className="text-sm text-ink/50">
              {t("order.eurApprox")
                .replace("{amount}", order.total_eur.toFixed(2))
                .replace("{rate}", order.eur_rate.toFixed(2))}
            </p>
          )}
        </div>
      )}

      <p className="text-ink/70">{t("order.thanksText")}</p>

      <div className="mt-4 flex flex-col items-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-cream transition hover:opacity-90"
        >
          {t("order.backHome")}
        </Link>
        <a
          href="https://www.instagram.com/bubu_odessa/"
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:opacity-80"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="0.9" fill="currentColor" stroke="none" />
          </svg>
          @bubu_odessa
        </a>
      </div>
    </div>
  );
}
