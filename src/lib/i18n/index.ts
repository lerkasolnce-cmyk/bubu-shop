import { cookies } from "next/headers";
import ua from "./dict.ua.json";
import ru from "./dict.ru.json";

export type Locale = "ua" | "ru";

const DICTS: Record<Locale, Record<string, string>> = { ua, ru };

const COOKIE_NAME = "locale";
const DEFAULT_LOCALE: Locale = "ua";

export function isLocale(value: unknown): value is Locale {
  return value === "ua" || value === "ru";
}

/** Reads the `locale` cookie (set by POST /api/locale). Defaults to 'ua'. */
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

/** Returns a translator function for the given locale: t('header.cart') -> string. */
export function getT(locale: Locale): (key: string) => string {
  const dict = DICTS[locale];
  return (key: string): string => dict[key] ?? key;
}

/**
 * Picks a localized field off a DB row, e.g. pick(category, 'name', 'ru') -> category.name_ru.
 * Falls back to the other locale when the requested value is missing/empty,
 * so a partially translated row never renders a blank label.
 */
export function pick<T>(row: T, field: string, locale: Locale): string {
  const record = row as Record<string, unknown>;
  const primary = record[`${field}_${locale}`];
  if (typeof primary === "string" && primary !== "") return primary;

  const other: Locale = locale === "ua" ? "ru" : "ua";
  const fallback = record[`${field}_${other}`];
  return typeof fallback === "string" ? fallback : "";
}
