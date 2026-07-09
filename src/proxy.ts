import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Next.js 16 renamed the `middleware.ts` file convention to `proxy.ts`
// (export `proxy` instead of `middleware`) — see node_modules/next/dist/docs
// /01-app/03-api-reference/03-file-conventions/proxy.md.
export async function proxy(request: NextRequest) {
  // Demo mode: no Supabase env configured yet. Let /admin/login render its
  // setup notice; send every other /admin path there instead of trying (and
  // failing) to check a session.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    if (request.nextUrl.pathname === "/admin/login") {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return updateSession(request);
}

export const config = {
  matcher: ["/admin/:path*"],
};
