"use client";

import { useState } from "react";

export type SpecsEditorLabels = {
  key: string;
  value: string;
  add: string;
  remove: string;
};

type Row = { key: string; value: string };

export default function SpecsEditor({
  initial,
  labels,
}: {
  initial: Record<string, string>;
  labels: SpecsEditorLabels;
}) {
  const [rows, setRows] = useState<Row[]>(() => {
    const entries = Object.entries(initial);
    return entries.length > 0 ? entries.map(([key, value]) => ({ key, value })) : [{ key: "", value: "" }];
  });

  function update(i: number, field: "key" | "value", val: string) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: val } : r)));
  }

  function addRow() {
    setRows((prev) => [...prev, { key: "", value: "" }]);
  }

  function removeRow(i: number) {
    setRows((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : [{ key: "", value: "" }]));
  }

  // Serialized on every render from the controlled `rows` state, so the hidden
  // input always reflects the latest edits without an extra effect.
  const json = JSON.stringify(
    Object.fromEntries(rows.filter((r) => r.key.trim() !== "").map((r) => [r.key.trim(), r.value]))
  );

  const inputCls =
    "w-full min-w-0 rounded-md border border-ink/15 bg-white px-2.5 py-1.5 text-sm text-ink placeholder:text-ink/40 focus:border-mint focus:outline-none";

  return (
    <div className="flex flex-col gap-2">
      <input type="hidden" name="specs" value={json} readOnly />
      {rows.map((row, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            aria-label={labels.key}
            placeholder={labels.key}
            value={row.key}
            onChange={(e) => update(i, "key", e.target.value)}
            className={inputCls}
          />
          <input
            aria-label={labels.value}
            placeholder={labels.value}
            value={row.value}
            onChange={(e) => update(i, "value", e.target.value)}
            className={inputCls}
          />
          <button
            type="button"
            onClick={() => removeRow(i)}
            className="shrink-0 rounded-md border border-ink/15 px-2 py-1.5 text-xs font-semibold text-ink/60 hover:bg-ink/5"
          >
            {labels.remove}
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addRow}
        className="self-start rounded-full border border-blush/60 px-3 py-1.5 text-xs font-semibold text-ink hover:bg-blush/20"
      >
        {labels.add}
      </button>
    </div>
  );
}
