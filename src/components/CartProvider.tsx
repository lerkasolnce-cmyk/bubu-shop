"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { CartItem } from "@/lib/types";
import { readCart, writeCart } from "@/lib/cart-storage";
import { addItem, removeItem, setQty as setQtyPure, cartCount } from "@/lib/cart";

type CartContextValue = {
  items: CartItem[];
  count: number;
  /** false until the initial localStorage read completes (hydration-safe). */
  ready: boolean;
  add: (slug: string, qty?: number) => void;
  remove: (slug: string) => void;
  setQty: (slug: string, qty: number) => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export default function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [ready, setReady] = useState(false);
  // Mutable mirror of `items` so the storage/event listener always compares
  // against the latest state without re-subscribing on every change.
  const itemsRef = useRef<CartItem[]>(items);
  itemsRef.current = items;

  useEffect(() => {
    setItems(readCart());
    setReady(true);
  }, []);

  // Persist whenever items change, once hydrated. Kept as a side effect (not
  // inlined in the setState updaters below) so it never runs during React's
  // render phase, which must stay pure.
  useEffect(() => {
    if (!ready) return;
    writeCart(items);
  }, [items, ready]);

  useEffect(() => {
    function syncFromStorage() {
      const next = readCart();
      // Guard against the loop where our own writeCart() re-triggers this listener.
      if (JSON.stringify(next) !== JSON.stringify(itemsRef.current)) {
        setItems(next);
      }
    }

    window.addEventListener("bubu:cart-changed", syncFromStorage);
    window.addEventListener("storage", syncFromStorage);
    return () => {
      window.removeEventListener("bubu:cart-changed", syncFromStorage);
      window.removeEventListener("storage", syncFromStorage);
    };
  }, []);

  // Functional setState updates so two calls issued in the same tick (e.g. a
  // fast double-click on two different rows) each see the correct previous
  // state instead of both reading the same stale snapshot.
  const add = useCallback(
    (slug: string, qty = 1) => setItems((prev) => addItem(prev, slug, qty)),
    []
  );

  const remove = useCallback((slug: string) => setItems((prev) => removeItem(prev, slug)), []);

  const setQty = useCallback(
    (slug: string, qty: number) => setItems((prev) => setQtyPure(prev, slug, qty)),
    []
  );

  return (
    <CartContext.Provider value={{ items, count: cartCount(items), ready, add, remove, setQty }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
