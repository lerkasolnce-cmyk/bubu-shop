import type { CartItem, Product } from "@/lib/types";

/** Pure cart logic — no browser APIs, safe to unit test directly. */

/** Adds `qty` (min 1) of `slug`, merging into an existing line if present. */
export function addItem(items: CartItem[], slug: string, qty = 1): CartItem[] {
  const safeQty = qty < 1 ? 1 : qty;
  const existing = items.find((item) => item.slug === slug);
  if (existing) {
    return items.map((item) =>
      item.slug === slug ? { ...item, qty: item.qty + safeQty } : item
    );
  }
  return [...items, { slug, qty: safeQty }];
}

/** Removes the line matching `slug`. No-op if the slug isn't in the cart. */
export function removeItem(items: CartItem[], slug: string): CartItem[] {
  return items.filter((item) => item.slug !== slug);
}

/** Sets the qty for `slug`. qty <= 0 removes the line entirely. */
export function setQty(items: CartItem[], slug: string, qty: number): CartItem[] {
  if (qty <= 0) return removeItem(items, slug);
  return items.map((item) => (item.slug === slug ? { ...item, qty } : item));
}

/** Sum of price * qty across the cart. Items with no matching product are ignored. */
export function cartTotal(items: CartItem[], products: Product[]): number {
  const priceBySlug = new Map(products.map((p) => [p.slug, p.price]));
  return items.reduce((sum, item) => {
    const price = priceBySlug.get(item.slug);
    return price != null ? sum + price * item.qty : sum;
  }, 0);
}

/** Total quantity across all cart lines. */
export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.qty, 0);
}
