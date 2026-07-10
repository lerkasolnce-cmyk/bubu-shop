"use client";

import { useState, useTransition } from "react";
import type { ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/types";
import { updateOrderStatus } from "@/app/admin/(protected)/orders/actions";

export type OrderStatusLabels = {
  new: string;
  confirmed: string;
  shipped: string;
  done: string;
  cancelled: string;
  updateError: string;
};

export default function OrderStatusSelect({
  id,
  status,
  labels,
}: {
  id: number;
  status: OrderStatus;
  labels: OrderStatusLabels;
}) {
  const router = useRouter();
  const [value, setValue] = useState<OrderStatus>(status);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as OrderStatus;
    const prev = value;
    setValue(next); // optimistic
    setError(null);

    startTransition(async () => {
      const res = await updateOrderStatus(id, next);
      if (!res.ok) {
        // res.error may carry a raw code — log it, show only the localized label.
        console.error("updateOrderStatus:", res.error);
        setValue(prev);
        setError(labels.updateError);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <select
        value={value}
        onChange={handleChange}
        disabled={pending}
        className="rounded-md border border-ink/15 bg-white px-2 py-1 text-xs font-semibold text-ink focus:border-mint focus:outline-none disabled:opacity-50"
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {labels[s]}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
