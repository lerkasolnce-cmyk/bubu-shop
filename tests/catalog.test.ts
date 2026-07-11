import { describe, it, expect } from "vitest";
import { sanitizeSearchTerm, parseQueryFromSearchParams, pluralKey } from "@/lib/catalog";

describe("sanitizeSearchTerm", () => {
  it("strips characters that break PostgREST filter syntax", () => {
    expect(sanitizeSearchTerm("a,b(c)d")).toBe("abcd");
  });

  it("strips ilike wildcards % and *", () => {
    expect(sanitizeSearchTerm("50%off*")).toBe("50off");
  });

  it("maps underscore to a space", () => {
    expect(sanitizeSearchTerm("baby_carrier")).toBe("baby carrier");
  });

  it("trims surrounding whitespace after stripping", () => {
    expect(sanitizeSearchTerm("  (test)  ")).toBe("test");
  });
});

describe("parseQueryFromSearchParams", () => {
  it("splits brand on commas and lowercases", () => {
    const q = parseQueryFromSearchParams({ brand: "Anex,CYBEX, Chicco" });
    expect(q.brands).toEqual(["anex", "cybex", "chicco"]);
  });

  it("leaves brands undefined when not provided", () => {
    const q = parseQueryFromSearchParams({});
    expect(q.brands).toBeUndefined();
  });

  it("treats a NaN min as undefined", () => {
    const q = parseQueryFromSearchParams({ min: "abc" });
    expect(q.minPrice).toBeUndefined();
  });

  it("clamps a negative min to 0", () => {
    const q = parseQueryFromSearchParams({ min: "-50" });
    expect(q.minPrice).toBe(0);
  });

  it("treats a NaN max as undefined", () => {
    const q = parseQueryFromSearchParams({ max: "xyz" });
    expect(q.maxPrice).toBeUndefined();
  });

  it("clamps a negative max to 0", () => {
    const q = parseQueryFromSearchParams({ max: "-10" });
    expect(q.maxPrice).toBe(0);
  });

  it("falls back to 'new' for a garbage sort value", () => {
    const q = parseQueryFromSearchParams({ sort: "banana" });
    expect(q.sort).toBe("new");
  });

  it("accepts a valid sort value", () => {
    const q = parseQueryFromSearchParams({ sort: "price_asc" });
    expect(q.sort).toBe("price_asc");
  });

  it("falls back to page 1 for page=0", () => {
    const q = parseQueryFromSearchParams({ page: "0" });
    expect(q.page).toBe(1);
  });

  it("falls back to page 1 for a negative page", () => {
    const q = parseQueryFromSearchParams({ page: "-3" });
    expect(q.page).toBe(1);
  });

  it("falls back to page 1 for a garbage page value", () => {
    const q = parseQueryFromSearchParams({ page: "abc" });
    expect(q.page).toBe(1);
  });

  it("takes the first value when a param is array-valued", () => {
    const q = parseQueryFromSearchParams({
      q: ["first", "second"],
      brand: ["Anex,Cybex"],
      page: ["2", "3"],
    });
    expect(q.q).toBe("first");
    expect(q.brands).toEqual(["anex", "cybex"]);
    expect(q.page).toBe(2);
  });
});

describe("pluralKey", () => {
  it("returns 'One' for 1", () => {
    expect(pluralKey(1)).toBe("One");
  });

  it("returns 'Few' for 2", () => {
    expect(pluralKey(2)).toBe("Few");
  });

  it("returns 'Many' for 5", () => {
    expect(pluralKey(5)).toBe("Many");
  });

  it("returns 'Many' for 11 (teen exception)", () => {
    expect(pluralKey(11)).toBe("Many");
  });

  it("returns 'One' for 21", () => {
    expect(pluralKey(21)).toBe("One");
  });

  it("returns 'Many' for 112 (112 % 100 === 12, teen exception)", () => {
    expect(pluralKey(112)).toBe("Many");
  });
});
