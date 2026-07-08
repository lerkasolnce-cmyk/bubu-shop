"use client";

import { useCart } from "./CartProvider";

/** Cart quantity badge, backed by the shared CartProvider context. */
export default function CartBadge() {
  const { count, ready } = useCart();

  if (!ready || count === 0) return null;

  return (
    <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-bold text-cream">
      {count}
    </span>
  );
}
