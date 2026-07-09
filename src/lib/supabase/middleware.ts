import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const LOGIN_PATH = "/admin/login";
const ADMIN_HOME = "/admin";

/**
 * Refreshes the Supabase session cookies on every /admin request (per @supabase/ssr's
 * proxy pattern) and enforces the auth gate: no session -> /admin/login, and a session
 * on the login page itself -> /admin. Assumes NEXT_PUBLIC_SUPABASE_URL/ANON_KEY are set —
 * callers must check demo mode before calling this.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and auth.getUser() — the client
  // relies on the getUser() call to refresh the session cookies eagerly.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === LOGIN_PATH;

  if (!user && !isLoginPage) {
    return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
  }

  if (user && isLoginPage) {
    // Carry any freshly rotated session cookies over to the redirect response,
    // otherwise a token refresh that happened in getUser() above would be lost.
    const redirectResponse = NextResponse.redirect(new URL(ADMIN_HOME, request.url));
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  return supabaseResponse;
}
