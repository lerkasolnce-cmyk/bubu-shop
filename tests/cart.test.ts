import { describe, it, expect } from "vitest";
import { addItem, removeItem, setQty, cartTotal, cartCount } from "@/lib/cart";
import type { CartItem, Product } from "@/lib/types";

function makeProduct(slug: string, price: number): Product {
  return {
    id: `id-${slug}`,
    slug,
    name_ua: slug,
    name_ru: slug,
    description_ua: "",
    description_ru: "",
    brand: "test",
    category_id: null,
    price,
    old_price: null,
    stock_status: "in_stock",
    specs: {},
    images: [],
    is_hit: false,
    is_sale: false,
    created_at: "2026-01-01T00:00:00.000Z",
  };
}

describe("addItem", () => {
  it("merges duplicates by incrementing qty", () => {
    const items: CartItem[] = [{ slug: "a", qty: 1 }];
    expect(addItem(items, "a", 2)).toEqual([{ slug: "a", qty: 3 }]);
  });

  it("appends a new slug", () => {
    const items: CartItem[] = [{ slug: "a", qty: 1 }];
    expect(addItem(items, "b")).toEqual([
      { slug: "a", qty: 1 },
      { slug: "b", qty: 1 },
    ]);
  });
});

describe("setQty", () => {
  it("removes the item when qty is 0", () => {
    const items: CartItem[] = [{ slug: "a", qty: 3 }];
    expect(setQty(items, "a", 0)).toEqual([]);
  });

  it("clamps negative qty to removal", () => {
    const items: CartItem[] = [{ slug: "a", qty: 3 }];
    expect(setQty(items, "a", -5)).toEqual([]);
  });

  it("updates qty for an existing slug", () => {
    const items: CartItem[] = [{ slug: "a", qty: 3 }];
    expect(setQty(items, "a", 5)).toEqual([{ slug: "a", qty: 5 }]);
  });
});

describe("removeItem", () => {
  it("is a no-op for a missing slug", () => {
    const items: CartItem[] = [{ slug: "a", qty: 1 }];
    expect(removeItem(items, "missing")).toEqual(items);
  });

  it("removes the matching slug", () => {
    const items: CartItem[] = [
      { slug: "a", qty: 1 },
      { slug: "b", qty: 2 },
    ];
    expect(removeItem(items, "a")).toEqual([{ slug: "b", qty: 2 }]);
  });
});

describe("cartTotal", () => {
  it("computes price * qty and ignores unknown slugs", () => {
    const items: CartItem[] = [
      { slug: "a", qty: 2 },
      { slug: "b", qty: 1 },
      { slug: "unknown", qty: 5 },
    ];
    const products = [makeProduct("a", 100), makeProduct("b", 50)];
    expect(cartTotal(items, products)).toBe(250);
  });
});

describe("cartCount", () => {
  it("sums qty across items", () => {
    const items: CartItem[] = [
      { slug: "a", qty: 2 },
      { slug: "b", qty: 3 },
    ];
    expect(cartCount(items)).toBe(5);
  });
});
