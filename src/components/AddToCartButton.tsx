"use client";

import { useEffect, useState } from "react";
import { useCart } from "./CartProvider";

export default function AddToCartButton({
  slug,
  label,
  disabled,
}: {
  slug: string;
  label: string;
  disabled?: boolean;
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const timer = window.setTimeout(() => setAdded(false), 1000);
    return () => window.clearTimeout(timer);
  }, [added]);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        add(slug);
        setAdded(true);
      }}
      className={
        disabled
          ? "w-full cursor-not-allowed rounded-full bg-ink/10 px-4 py-2 text-sm font-bold text-ink/40"
          : "w-full rounded-full bg-accent px-4 py-2 text-sm font-bold text-cream transition hover:opacity-90 active:scale-95"
      }
    >
      {added ? "✓" : label}
    </button>
  );
}
