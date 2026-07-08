"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { SortKey } from "@/lib/catalog";

const SORT_KEYS: SortKey[] = ["new", "price_asc", "price_desc", "hits"];

export default function SortSelect({
  value,
  basePath,
  labels,
}: {
  value: SortKey;
  basePath: string;
  labels: Record<SortKey, string>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", e.target.value);
    params.delete("page");
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <select
      value={value}
      onChange={onChange}
      className="rounded-md border border-blush/60 bg-white px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none"
    >
      {SORT_KEYS.map((key) => (
        <option key={key} value={key}>
          {labels[key]}
        </option>
      ))}
    </select>
  );
}
