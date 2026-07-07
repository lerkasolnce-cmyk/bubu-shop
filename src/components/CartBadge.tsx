"use client";

import { useEffect, useState } from "react";
import type { CartItem } from "@/lib/types";

const STORAGE_KEY = "bubu_cart";

function readCartCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return 0;
    const items = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(items)) return 0;
    return items.reduce((sum, item) => sum + (Number(item?.qty) || 0), 0);
  } catch {
    return 0;
  }
}

/**
 * Self-contained cart quantity badge. Reads localStorage on mount and
 * re-reads whenever a 'bubu:cart-changed' event fires. Will be replaced
 * by a shared cart context in Task 7.
 */
export default function CartBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(readCartCount());

    function onCartChanged() {
      setCount(readCartCount());
    }

    window.addEventListener("bubu:cart-changed", onCartChanged);
    return () => window.removeEventListener("bubu:cart-changed", onCartChanged);
  }, []);

  if (count === 0) return null;

  return (
    <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-cream">
      {count}
    </span>
  );
}
