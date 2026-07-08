import type { CartItem } from "@/lib/types";
import { addItem } from "@/lib/cart";

const STORAGE_KEY = "bubu_cart";

/** Reads the cart from localStorage. Tolerates missing/garbage data → []. */
export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CartItem =>
        !!item &&
        typeof item === "object" &&
        typeof (item as CartItem).slug === "string" &&
        typeof (item as CartItem).qty === "number" &&
        (item as CartItem).qty > 0
    );
  } catch {
    return [];
  }
}

/** Persists the cart and notifies listeners (e.g. CartProvider) via a custom event. */
export function writeCart(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent("bubu:cart-changed"));
}

/** Adds `qty` of `slug` to the cart, merging with an existing line if present. */
export function addToCart(slug: string, qty = 1): void {
  writeCart(addItem(readCart(), slug, qty));
}
