import { cookies } from "next/headers";
import { isLocale, type Locale } from "@/lib/i18n";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const locale: Locale = isLocale(body?.locale) ? body.locale : "ua";

  const cookieStore = await cookies();
  cookieStore.set("locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: false,
  });

  return new Response(null, { status: 204 });
}
