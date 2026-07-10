"use client";

import { useMemo, useState } from "react";
import type { Category } from "@/lib/types";
import CategoryRow, { type CategoryLabels } from "./CategoryRow";

export type { CategoryLabels };

type Row = Category & { _key: string };

let keyCounter = 0;
function newKey(): string {
  keyCounter += 1;
  return `new-${Date.now()}-${keyCounter}`;
}

export default function CategoriesTable({
  initialCategories,
  labels,
}: {
  initialCategories: Category[];
  labels: CategoryLabels;
}) {
  const [rows, setRows] = useState<Row[]>(() => initialCategories.map((c) => ({ ...c, _key: c.id })));

  // Only saved root categories can be picked as a parent — a 2-level hierarchy only.
  const rootOptions = useMemo(() => rows.filter((r) => r.id !== "" && r.parent_id === null), [rows]);

  function handleAdd() {
    setRows((prev) => [
      ...prev,
      {
        id: "",
        slug: "",
        name_ua: "",
        name_ru: "",
        parent_id: null,
        sort: prev.length,
        _key: newKey(),
      },
    ]);
  }

  function handleSaved(key: string, saved: Category) {
    setRows((prev) => prev.map((r) => (r._key === key ? { ...saved, _key: saved.id } : r)));
  }

  function handleDeleted(key: string) {
    setRows((prev) => prev.filter((r) => r._key !== key));
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.length === 0 ? (
        <p className="rounded-lg border border-blush/40 bg-white p-6 text-center text-sm text-ink/60">
          {labels.empty}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-blush/40 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-blush/40 text-left text-xs font-semibold uppercase tracking-wide text-ink/50">
                <th className="px-3 py-2">{labels.colNameUa}</th>
                <th className="px-3 py-2">{labels.colNameRu}</th>
                <th className="px-3 py-2">{labels.colSlug}</th>
                <th className="px-3 py-2">{labels.colParent}</th>
                <th className="px-3 py-2">{labels.colSort}</th>
                <th className="px-3 py-2 text-right">{labels.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <CategoryRow
                  key={row._key}
                  category={row}
                  rootOptions={rootOptions.filter((o) => o.id !== row.id)}
                  labels={labels}
                  onSaved={(saved) => handleSaved(row._key, saved)}
                  onDeleted={() => handleDeleted(row._key)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button
        type="button"
        onClick={handleAdd}
        className="self-start rounded-full bg-ink px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
      >
        {labels.add}
      </button>
    </div>
  );
}
