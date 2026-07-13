import { describe, it, expect } from "vitest";
import { categories, products } from "../scripts/seed-data";

describe("seed-data catalog integrity", () => {
  it("has no duplicate product slugs", () => {
    const slugs = products.map((p) => p.slug);
    const unique = new Set(slugs);
    const duplicates = slugs.filter((s, i) => slugs.indexOf(s) !== i);
    expect(duplicates, `duplicate slugs: ${duplicates.join(", ")}`).toEqual([]);
    expect(unique.size).toBe(products.length);
  });

  it("has no duplicate category slugs", () => {
    const slugs = categories.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(categories.length);
  });

  it("every product's category_slug exists in categories", () => {
    const categorySlugs = new Set(categories.map((c) => c.slug));
    const missing = products
      .filter((p) => !categorySlugs.has(p.category_slug))
      .map((p) => `${p.slug} -> ${p.category_slug}`);
    expect(missing, `products with unknown category_slug: ${missing.join(", ")}`).toEqual([]);
  });

  it("every child category's parent_slug exists in categories", () => {
    const categorySlugs = new Set(categories.map((c) => c.slug));
    const missing = categories
      .filter((c) => c.parent_slug && !categorySlugs.has(c.parent_slug))
      .map((c) => `${c.slug} -> ${c.parent_slug}`);
    expect(missing).toEqual([]);
  });

  it("every product has a positive price", () => {
    const bad = products.filter((p) => !(p.price > 0)).map((p) => p.slug);
    expect(bad).toEqual([]);
  });

  it("old_price is greater than price whenever set", () => {
    const bad = products
      .filter((p) => p.old_price !== null && !(p.old_price > p.price))
      .map((p) => p.slug);
    expect(bad).toEqual([]);
  });

  it("has more than 40 Anex products", () => {
    expect(products.filter((p) => p.brand === "Anex").length).toBeGreaterThan(40);
  });

  it("has more than 70 Cybex products", () => {
    expect(products.filter((p) => p.brand === "Cybex").length).toBeGreaterThan(70);
  });

  it("has more than 40 Espiro products", () => {
    expect(products.filter((p) => p.brand === "Espiro").length).toBeGreaterThan(40);
  });

  it("strollers-twins category is non-empty", () => {
    expect(products.filter((p) => p.category_slug === "strollers-twins").length).toBeGreaterThan(0);
  });

  it("car-seat-bases category is non-empty", () => {
    expect(products.filter((p) => p.category_slug === "car-seat-bases").length).toBeGreaterThan(0);
  });
});
