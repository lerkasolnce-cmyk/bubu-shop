import { NextRequest, NextResponse } from "next/server";
import { mapWarehouses, npCall } from "@/lib/np";

const REF_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Warehouse lookup: GET /api/np/warehouses?cityRef=<uuid>&q=55 -> { warehouses: NpWarehouse[] } */
export async function GET(req: NextRequest) {
  const cityRef = (req.nextUrl.searchParams.get("cityRef") ?? "").trim();
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 60);
  if (!REF_RE.test(cityRef)) {
    return NextResponse.json({ warehouses: [] });
  }

  const props: Record<string, string> = { CityRef: cityRef, Limit: "60" };
  if (q) props.FindByString = q;

  try {
    const data = await npCall("getWarehouses", props);
    return NextResponse.json(
      { warehouses: mapWarehouses(data) },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
    );
  } catch {
    return NextResponse.json({ error: "np_unavailable" }, { status: 502 });
  }
}
