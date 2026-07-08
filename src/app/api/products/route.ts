import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { demoProducts, isDemoMode } from "@/lib/demo";
import type { Product } from "@/lib/types";

const MAX_SLUGS = 100;

/** GET /api/products?slugs=a,b,c -> Product[]. Used by the cart page to hydrate line items. */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get("slugs") ?? "";
  const slugs = Array.from(
    new Set(
      raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    )
  ).slice(0, MAX_SLUGS);

  if (slugs.length === 0) {
    return NextResponse.json([]);
  }

  if (isDemoMode()) {
    const set = new Set(slugs);
    return NextResponse.json(demoProducts.filter((p) => set.has(p.slug)));
  }

  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase.from("products").select("*").in("slug", slugs);
    if (error || !data) {
      if (error) console.error("GET /api/products:", error.message);
      return NextResponse.json([]);
    }
    return NextResponse.json(data as Product[]);
  } catch (e) {
    console.error("GET /api/products:", e);
    return NextResponse.json([]);
  }
}
