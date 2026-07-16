import { describe, expect, it } from "vitest";
import { mapSettlements, mapWarehouses } from "@/lib/np";

describe("mapSettlements", () => {
  it("maps the searchSettlements payload shape", () => {
    const data = [
      {
        TotalCount: 2,
        Addresses: [
          {
            Present: "м. Одеса, Одеська обл.",
            DeliveryCity: "db5c88d0-391c-11dd-90d9-001a92567626",
            Warehouses: 2791,
            MainDescription: "Одеса",
          },
          {
            Present: "с. Мала Одеса",
            DeliveryCity: "aaaa1111-391c-11dd-90d9-001a92567626",
            Warehouses: 0,
          },
        ],
      },
    ];
    expect(mapSettlements(data)).toEqual([
      {
        present: "м. Одеса, Одеська обл.",
        ref: "db5c88d0-391c-11dd-90d9-001a92567626",
        hasWarehouses: true,
      },
      {
        present: "с. Мала Одеса",
        ref: "aaaa1111-391c-11dd-90d9-001a92567626",
        hasWarehouses: false,
      },
    ]);
  });

  it("drops malformed entries instead of throwing", () => {
    const data = [
      {
        Addresses: [
          null,
          42,
          { Present: "", DeliveryCity: "x" },
          { Present: "м. Київ", DeliveryCity: "" },
          { Present: "м. Київ", DeliveryCity: "ref-1", Warehouses: "12" },
        ],
      },
    ];
    expect(mapSettlements(data)).toEqual([{ present: "м. Київ", ref: "ref-1", hasWarehouses: true }]);
  });

  it("returns [] on empty or unexpected payloads", () => {
    expect(mapSettlements([])).toEqual([]);
    expect(mapSettlements([{ TotalCount: 0 }])).toEqual([]);
    expect(mapSettlements(["garbage"])).toEqual([]);
  });
});

describe("mapWarehouses", () => {
  it("maps descriptions with RU fallback to UA", () => {
    const data = [
      { Description: "Відділення №49: Балтська дорога, 55", DescriptionRu: "Отделение №49: Балтская дорога, 55" },
      { Description: "Поштомат №5555", DescriptionRu: "" },
    ];
    expect(mapWarehouses(data)).toEqual([
      { ua: "Відділення №49: Балтська дорога, 55", ru: "Отделение №49: Балтская дорога, 55" },
      { ua: "Поштомат №5555", ru: "Поштомат №5555" },
    ]);
  });

  it("drops malformed entries", () => {
    expect(mapWarehouses([null, 7, { DescriptionRu: "только ру" }, { Description: "ok" }])).toEqual([
      { ua: "ok", ru: "ok" },
    ]);
  });
});
