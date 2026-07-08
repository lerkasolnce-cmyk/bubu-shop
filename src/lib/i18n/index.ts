import { cookies } from "next/headers";

export type { Locale } from "./shared";
export { isLocale, getT, pick } from "./shared";
import { isLocale, type Locale } from "./shared";

const COOKIE_NAME = "locale";
const DEFAULT_LOCALE: Locale = "ua";

/** Reads the `locale` cookie (set by POST /api/locale). Defaults to 'ua'. */
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(COOKIE_NAME)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
