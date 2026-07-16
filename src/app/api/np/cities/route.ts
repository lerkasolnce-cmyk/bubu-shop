import { NextRequest, NextResponse } from "next/server";
import { mapSettlements, npCall } from "@/lib/np";

/** City autocomplete: GET /api/np/cities?q=одес -> { cities: NpCity[] } */
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim();
  if (q.length < 2 || q.length > 60) {
    return NextResponse.json({ cities: [] });
  }

  try {
    const data = await npCall("searchSettlements", { CityName: q, Limit: "8" });
    return NextResponse.json(
      { cities: mapSettlements(data) },
      // NP settlements change rarely — let the Vercel edge cache per query string.
      { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } }
    );
  } catch {
    return NextResponse.json({ error: "np_unavailable" }, { status: 502 });
  }
}
