// Client-safe i18n helpers — no `next/headers` import here, so client components
// (e.g. CartView) can use these without pulling a server-only dependency into
// their bundle. `getLocale` (which needs cookies()) lives in ./index.ts instead.
import ua from "./dict.ua.json";
import ru from "./dict.ru.json";
import it from "./dict.it.json";
import en from "./dict.en.json";

export type Locale = "ua" | "ru" | "it" | "en";

export const DICTS: Record<Locale, Record<string, string>> = { ua, ru, it, en };

export function isLocale(value: unknown): value is Locale {
  return value === "ua" || value === "ru" || value === "it" || value === "en";
}

/** Returns a translator function for the given locale: t('header.cart') -> string. */
export function getT(locale: Locale): (key: string) => string {
  const dict = DICTS[locale];
  return (key: string): string => dict[key] ?? key;
}

/**
 * Picks a localized field off a DB row, e.g. pick(category, 'name', 'ru') -> category.name_ru.
 * Falls back to another locale when the requested value is missing/empty, so a
 * partially translated row never renders a blank label:
 *  - ua/ru fall back to each other (both are first-class content locales).
 *  - it/en (name_it/name_en are often untranslated) fall back to name_ua —
 *    UAH/Ukrainian is the shop's primary business locale.
 */
export function pick<T>(row: T, field: string, locale: Locale): string {
  const record = row as Record<string, unknown>;
  const primary = record[`${field}_${locale}`];
  if (typeof primary === "string" && primary !== "") return primary;

  const other: Locale = locale === "ua" || locale === "ru" ? (locale === "ua" ? "ru" : "ua") : "ua";
  const fallback = record[`${field}_${other}`];
  return typeof fallback === "string" ? fallback : "";
}
