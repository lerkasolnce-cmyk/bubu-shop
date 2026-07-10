"use client";

import { useState, useTransition } from "react";
import { parseProductsCsv, type ProductCsvRow } from "@/lib/csv";
import {
  importProducts,
  exportProducts,
  type ImportResult,
  type SkippedRow,
} from "@/app/admin/(protected)/import/actions";

export type ImportPanelLabels = {
  demoNotice: string;
  chooseFile: string;
  previewTitle: string;
  validRows: string; // contains a literal "{count}" placeholder
  errorsTitle: string; // contains a literal "{count}" placeholder
  colSlug: string;
  colName: string;
  colBrand: string;
  colCategory: string;
  colPrice: string;
  colStock: string;
  stockInStock: string;
  stockPreorder: string;
  stockOutOfStock: string;
  importButton: string; // contains a literal "{count}" placeholder
  importing: string;
  progress: string; // contains literal "{done}" and "{total}" placeholders
  exportButton: string;
  exporting: string;
  resultTitle: string;
  resultCreated: string; // contains a literal "{count}" placeholder
  resultUpdated: string; // contains a literal "{count}" placeholder
  resultSkipped: string; // contains a literal "{count}" placeholder
  reasonUnknownCategory: string;
  reasonInvalidRow: string;
  reasonUnknown: string;
  errorGeneric: string;
  exportError: string;
};

const PREVIEW_ROWS = 20;

// Rows per importProducts() call. The whole file in one Server Action call would blow
// Next's default 1MB request body limit on a real 2-3k-row catalog, so the client
// sends sequential chunks and aggregates the results.
const IMPORT_CHUNK = 300;

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function downloadCsv(csvText: string, filename: string) {
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function reasonLabel(labels: ImportPanelLabels, reason: string): string {
  if (reason === "unknown_category") return labels.reasonUnknownCategory;
  if (reason === "invalid_row") return labels.reasonInvalidRow;
  return labels.reasonUnknown;
}

function stockLabel(labels: ImportPanelLabels, status: ProductCsvRow["stock_status"]): string {
  if (status === "in_stock") return labels.stockInStock;
  if (status === "preorder") return labels.stockPreorder;
  return labels.stockOutOfStock;
}

export default function ImportPanel({ labels, demoMode }: { labels: ImportPanelLabels; demoMode: boolean }) {
  const [parsed, setParsed] = useState<{ rows: ProductCsvRow[]; errors: string[] } | null>(null);
  const [importPending, startImport] = useTransition();
  const [exportPending, startExport] = useTransition();
  const [result, setResult] = useState<ImportResult | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  function handleFile(file: File | null) {
    if (!file) return;
    setResult(null);
    setError(null);

    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string" ? reader.result : "";
      setParsed(parseProductsCsv(text));
    };
    reader.readAsText(file);
  }

  function handleImport() {
    if (!parsed || parsed.rows.length === 0) return;
    setError(null);
    setResult(null);
    startImport(async () => {
      const all = parsed.rows;
      const total = all.length;
      let created = 0;
      let updated = 0;
      const skipped: SkippedRow[] = [];

      setProgress({ done: 0, total });
      try {
        for (let offset = 0; offset < total; offset += IMPORT_CHUNK) {
          const chunk = all.slice(offset, offset + IMPORT_CHUNK);
          const res = await importProducts(chunk);
          if (!res.ok) {
            // res.error may carry a raw/internal code — don't surface it verbatim to the UI.
            console.error("importProducts:", res.error);
            setError(labels.errorGeneric);
            return;
          }
          created += res.created ?? 0;
          updated += res.updated ?? 0;
          // res.skipped[].row is 1-based into the CHUNK we just sent — remap to the
          // original rows array so the result panel points at the right product.
          for (const s of res.skipped ?? []) skipped.push({ row: offset + s.row, reason: s.reason });
          setProgress({ done: Math.min(offset + chunk.length, total), total });
        }
        setResult({ ok: true, created, updated, skipped });
      } catch (e) {
        // A thrown Server Action (413 body too large, network drop) rejects instead of
        // returning {ok:false} — without this the spinner would just stop silently.
        console.error("importProducts:", e);
        setError(labels.errorGeneric);
      } finally {
        setProgress(null);
      }
    });
  }

  function handleExport() {
    setExportError(null);
    startExport(async () => {
      try {
        const res = await exportProducts();
        if (!res.ok || res.csv == null) {
          console.error("exportProducts:", res.error);
          setExportError(labels.exportError);
          return;
        }
        downloadCsv(res.csv, `bubu-products-${todayStr()}.csv`);
      } catch (e) {
        // Same reasoning as handleImport: a rejected action must surface an error.
        console.error("exportProducts:", e);
        setExportError(labels.exportError);
      }
    });
  }

  const rows = parsed?.rows ?? [];
  const errors = parsed?.errors ?? [];
  const preview = rows.slice(0, PREVIEW_ROWS);

  return (
    <div className="flex flex-col gap-6">
      {demoMode && (
        <p className="rounded-md border border-ink/10 bg-ink/5 px-3 py-2 text-xs text-ink/50">{labels.demoNotice}</p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full border border-blush/60 px-4 py-2 text-sm font-semibold text-ink hover:bg-blush/20">
          {labels.chooseFile}
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => {
              handleFile(e.target.files?.[0] ?? null);
              e.target.value = "";
            }}
          />
        </label>

        <button
          type="button"
          onClick={handleExport}
          disabled={demoMode || exportPending}
          className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink hover:bg-ink/5 disabled:opacity-50"
        >
          {exportPending ? labels.exporting : labels.exportButton}
        </button>
      </div>
      {exportError && <p className="text-xs text-red-600">{exportError}</p>}

      {parsed && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-bold text-ink">{labels.previewTitle}</h2>
          <p className="text-sm text-ink/70">{labels.validRows.replace("{count}", String(rows.length))}</p>

          {preview.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-blush/40 bg-white">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-blush/40 text-left text-xs font-semibold uppercase tracking-wide text-ink/50">
                    <th className="px-3 py-2">{labels.colSlug}</th>
                    <th className="px-3 py-2">{labels.colName}</th>
                    <th className="px-3 py-2">{labels.colBrand}</th>
                    <th className="px-3 py-2">{labels.colCategory}</th>
                    <th className="px-3 py-2">{labels.colPrice}</th>
                    <th className="px-3 py-2">{labels.colStock}</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((r, i) => (
                    <tr key={r.slug + i} className="border-b border-blush/20 last:border-0">
                      <td className="px-3 py-2 text-ink/70">{r.slug}</td>
                      <td className="px-3 py-2 font-semibold text-ink">{r.name_ua}</td>
                      <td className="px-3 py-2 text-ink/70">{r.brand}</td>
                      <td className="px-3 py-2 text-ink/70">{r.category_slug}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-ink">₴{r.price.toLocaleString("uk-UA")}</td>
                      <td className="px-3 py-2 text-ink/70">{stockLabel(labels, r.stock_status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {errors.length > 0 && (
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-bold text-red-600">
                {labels.errorsTitle.replace("{count}", String(errors.length))}
              </h3>
              <ul className="max-h-48 list-inside list-disc overflow-y-auto rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                {errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <button
              type="button"
              onClick={handleImport}
              disabled={demoMode || importPending || rows.length === 0}
              className={
                importPending || rows.length === 0 || demoMode
                  ? "cursor-not-allowed rounded-full bg-ink/20 px-5 py-2.5 text-sm font-bold text-white"
                  : "rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
              }
            >
              {importPending
                ? progress
                  ? labels.progress.replace("{done}", String(progress.done)).replace("{total}", String(progress.total))
                  : labels.importing
                : labels.importButton.replace("{count}", String(rows.length))}
            </button>
          </div>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
          )}

          {result && (
            <div className="flex flex-col gap-1 rounded-md border border-mint/60 bg-mint/10 px-3 py-2 text-sm text-ink">
              <h3 className="font-bold">{labels.resultTitle}</h3>
              <p>{labels.resultCreated.replace("{count}", String(result.created ?? 0))}</p>
              <p>{labels.resultUpdated.replace("{count}", String(result.updated ?? 0))}</p>
              <p>{labels.resultSkipped.replace("{count}", String(result.skipped?.length ?? 0))}</p>
              {result.skipped && result.skipped.length > 0 && (
                <ul className="mt-1 max-h-40 overflow-y-auto text-xs text-ink/60">
                  {result.skipped.map((s, i) => {
                    // s.row is 1-based into the exact `rows` array we submitted to
                    // importProducts (the same array still held in `rows` here), so it
                    // can be resolved back to the product's slug for a readable message.
                    const slug = rows[s.row - 1]?.slug;
                    return (
                      <li key={i}>
                        {slug ? `${slug} (#${s.row})` : `#${s.row}`}: {reasonLabel(labels, s.reason)}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
