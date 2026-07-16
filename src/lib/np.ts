// Nova Poshta address API (searchSettlements / getWarehouses). The address
// dictionaries work with an empty apiKey; NOVA_POSHTA_API_KEY can be set in env
// later without code changes (personal keys have higher rate limits).
const NP_API_URL = "https://api.novaposhta.ua/v2.0/json/";

type NpResponse = { success: boolean; data: unknown[] };

export type NpCity = {
  /** Display string stored in the order, e.g. "м. Одеса, Одеська обл." */
  present: string;
  /** CityRef (DeliveryCity) accepted by getWarehouses */
  ref: string;
  hasWarehouses: boolean;
};

export type NpWarehouse = {
  ua: string;
  ru: string;
};

export async function npCall(
  calledMethod: string,
  methodProperties: Record<string, string>
): Promise<unknown[]> {
  const res = await fetch(NP_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      apiKey: process.env.NOVA_POSHTA_API_KEY ?? "",
      modelName: "AddressGeneral",
      calledMethod,
      methodProperties,
    }),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`np http ${res.status}`);
  const json = (await res.json()) as NpResponse;
  if (!json.success || !Array.isArray(json.data)) throw new Error("np unsuccessful");
  return json.data;
}

/** searchSettlements payload -> NpCity[]; malformed entries are dropped, never thrown. */
export function mapSettlements(data: unknown[]): NpCity[] {
  const first = data[0] as { Addresses?: unknown[] } | undefined;
  if (!first || !Array.isArray(first.Addresses)) return [];
  const out: NpCity[] = [];
  for (const raw of first.Addresses) {
    if (typeof raw !== "object" || raw === null) continue;
    const a = raw as Record<string, unknown>;
    const present = typeof a.Present === "string" ? a.Present : "";
    const ref = typeof a.DeliveryCity === "string" ? a.DeliveryCity : "";
    const warehouses = typeof a.Warehouses === "number" ? a.Warehouses : Number(a.Warehouses) || 0;
    if (present && ref) out.push({ present, ref, hasWarehouses: warehouses > 0 });
  }
  return out;
}

/** getWarehouses payload -> NpWarehouse[]; RU description falls back to UA. */
export function mapWarehouses(data: unknown[]): NpWarehouse[] {
  const out: NpWarehouse[] = [];
  for (const raw of data) {
    if (typeof raw !== "object" || raw === null) continue;
    const w = raw as Record<string, unknown>;
    const ua = typeof w.Description === "string" ? w.Description : "";
    const ru = typeof w.DescriptionRu === "string" && w.DescriptionRu ? w.DescriptionRu : ua;
    if (ua) out.push({ ua, ru });
  }
  return out;
}
