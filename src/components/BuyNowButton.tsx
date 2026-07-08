"use client";

import { useRouter } from "next/navigation";
import { useCart } from "./CartProvider";

export default function BuyNowButton({
  slug,
  label,
  disabled,
}: {
  slug: string;
  label: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const { add } = useCart();

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        if (disabled) return;
        add(slug);
        router.push("/cart");
      }}
      className={
        disabled
          ? "w-full cursor-not-allowed rounded-full border border-ink/10 px-4 py-2 text-sm font-bold text-ink/40"
          : "w-full rounded-full border-2 border-ink px-4 py-2 text-sm font-bold text-ink transition hover:bg-ink hover:text-cream active:scale-95"
      }
    >
      {label}
    </button>
  );
}
