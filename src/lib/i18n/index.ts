import { cookies } from "next/headers";
import ua from "./dict.ua.json";
import ru from "./dict.ru.json";

export type Locale = "ua" | "ru";

const DICTS: Record<Locale, Record<string, string>> = { ua, ru };

const COOKIE_NAME = "locale";
const DEFAULT_LOCALE: Locale = "ua";

function isLocale(value: string | undefined): value is Locale {
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

/** Picks a localized field off a DB row, e.g. pick(category, 'name', 'ru') -> category.name_ru. */
export function pick<T>(row: T, field: string, locale: Locale): string {
  const value = (row as Record<string, unknown>)[`${field}_${locale}`];
  return typeof value === "string" ? value : "";
}
