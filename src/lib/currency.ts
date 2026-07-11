// EUR pricing helper. UAH is always the primary currency — DB/admin/monopay
// deal in UAH exclusively. This module only converts for *display* to
// shoppers on the 'it' locale, using the NBU official rate at read time
// (and, once an order is placed, the fixed rate stored on that order — see
// POST /api/orders).
import type { Locale } from "./i18n/shared";

const NBU_EUR_URL = "https://bank.gov.ua/NBUStatService/v1/statdirectory/exchange?valcode=EUR&json";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const FETCH_TIMEOUT_MS = 5000;

function fallbackRate(): number {
  return Number(process.env.EUR_UAH_FALLBACK_RATE ?? 48);
}

// Module-scope cache — one NBU fetch per hour per server process, not per request.
let cachedRate: number | null = null;
let cachedAt = 0;

/**
 * Fetches the current EUR/UAH rate from the NBU. Cached for 1h. Never
 * throws — any failure (network error, non-2xx, malformed body, timeout)
 * resolves to the EUR_UAH_FALLBACK_RATE env var, or 48 if unset.
 */
export async function getEurRate(): Promise<number> {
  const now = Date.now();
  if (cachedRate != null && now - cachedAt < CACHE_TTL_MS) {
    return cachedRate;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    let res: Response;
    try {
      res = await fetch(NBU_EUR_URL, { signal: controller.signal });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) throw new Error(`NBU exchange endpoint responded ${res.status}`);

    const data = (await res.json()) as Array<{ rate?: unknown }>;
    const rate = data?.[0]?.rate;
    if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
      throw new Error("NBU exchange endpoint returned no usable rate");
    }

    cachedRate = rate;
    cachedAt = now;
    return rate;
  } catch (err) {
    console.error("getEurRate: falling back to EUR_UAH_FALLBACK_RATE", err instanceof Error ? err.message : err);
    return fallbackRate();
  }
}

/** Test-only: resets the module-scope cache so getEurRate() re-fetches. */
export function __clearCache(): void {
  cachedRate = null;
  cachedAt = 0;
}

/** Converts a UAH amount to EUR at the given rate, rounded to 2 decimals. */
export function uahToEur(uah: number, rate: number): number {
  // + Number.EPSILON guards against the classic fp truncation where
  // Math.round(1.005 * 100) / 100 yields 1 instead of 1.01.
  return Math.round((uah / rate + Number.EPSILON) * 100) / 100;
}

/**
 * Formats a UAH price for display. Only the 'it' locale (with a rate
 * supplied) ever shows EUR — every other locale, and 'it' without a rate,
 * shows the UAH amount (grn is always the underlying business currency).
 */
export function formatPrice(uah: number, locale: Locale, rate?: number): string {
  if (locale === "it" && rate) {
    const eur = uahToEur(uah, rate);
    const formatted = new Intl.NumberFormat("it-IT", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(eur);
    return `€${formatted}`;
  }

  const formatted = new Intl.NumberFormat("uk-UA", { maximumFractionDigits: 0 }).format(uah);
  return `₴${formatted}`;
}
