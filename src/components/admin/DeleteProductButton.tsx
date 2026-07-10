"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProduct } from "@/app/admin/(protected)/products/actions";

export default function DeleteProductButton({
  id,
  label,
  confirmLabel,
  errorLabel,
}: {
  id: string;
  label: string;
  confirmLabel: string;
  errorLabel: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    if (!window.confirm(confirmLabel)) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteProduct(id);
      if (!res.ok) {
        // res.error may carry a raw Postgres message — log it, show only the localized label.
        console.error("deleteProduct:", res.error);
        setError(errorLabel);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
      >
        {label}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
