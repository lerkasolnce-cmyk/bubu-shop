import Papa from "papaparse";
import type { StockStatus } from "@/lib/types";

export const CSV_COLUMNS = [
  "slug",
  "name_ua",
  "name_ru",
  "brand",
  "category_slug",
  "price",
  "old_price",
  "stock_status",
  "is_hit",
  "is_sale",
  "description_ua",
  "description_ru",
] as const;

export type ProductCsvRow = {
  slug: string;
  name_ua: string;
  name_ru: string;
  brand: string;
  category_slug: string;
  price: number;
  old_price: number | null;
  stock_status: StockStatus;
  is_hit: boolean;
  is_sale: boolean;
  description_ua: string;
  description_ru: string;
};

/** Shape productsToCsv() needs from each product — same fields as a CSV row, sourced from a DB row plus its resolved category slug. */
export type ProductLike = ProductCsvRow;

const STOCK_STATUSES: readonly StockStatus[] = ["in_stock", "preorder", "out_of_stock"];
const BOM = "﻿";
const MAX_ERRORS = 100;

const NON_NEGATIVE_INT = /^\d+$/;

const TRUE_VALUES = new Set(["1", "true", "yes"]);
const FALSE_VALUES = new Set(["0", "false", "no", ""]);

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function parseBoolField(raw: string | undefined): { ok: true; value: boolean } | { ok: false } {
  const v = (raw ?? "").trim().toLowerCase();
  if (TRUE_VALUES.has(v)) return { ok: true, value: true };
  if (FALSE_VALUES.has(v)) return { ok: true, value: false };
  return { ok: false };
}

/**
 * Parses a products CSV (papaparse, header:true). Strips a leading UTF-8 BOM and
 * accepts \n/\r\n line endings. Header must contain every column in CSV_COLUMNS or
 * parsing aborts with a single error and no rows (there's no sane per-row recovery
 * from a structurally wrong file). Otherwise every data row is validated independently;
 * a row with any problem is dropped from `rows` and each problem is reported in
 * `errors` with its 1-based data row number (header excluded). Blank lines are skipped
 * without an error but still consume a row number — papaparse's skipEmptyLines would
 * silently drop them BEFORE indexing, shifting every later row's reported number away
 * from what the owner sees in her spreadsheet, so empty rows are filtered here instead.
 * Duplicate slugs: the first occurrence wins, later ones are reported as errors and
 * dropped. `errors` is capped at 100 entries plus one "...and N more" summary line, so
 * a bad 3000-row file doesn't produce a 3000-line error dump.
 */
export function parseProductsCsv(text: string): { rows: ProductCsvRow[]; errors: string[] } {
  const cleaned = stripBom(text);

  const parsed = Papa.parse<Record<string, string>>(cleaned, {
    header: true,
    skipEmptyLines: false,
  });

  const fields = parsed.meta.fields ?? [];
  const missing = CSV_COLUMNS.filter((c) => !fields.includes(c));
  if (missing.length > 0) {
    return { rows: [], errors: [`Файл не містить обов'язкових колонок: ${missing.join(", ")}`] };
  }

  const rows: ProductCsvRow[] = [];
  const errors: string[] = [];
  const seenSlugs = new Set<string>();

  parsed.data.forEach((raw, index) => {
    const rowNum = index + 1;

    // Fully-empty line (also covers the phantom row a trailing newline produces):
    // no error, but the row number above is still consumed so later rows keep
    // their spreadsheet-visible numbering.
    if (Object.values(raw).every((v) => (v ?? "").trim() === "")) return;

    const rowErrors: string[] = [];

    const slug = (raw.slug ?? "").trim();
    if (!slug) rowErrors.push(`Рядок ${rowNum}: відсутній slug`);

    const name_ua = (raw.name_ua ?? "").trim();
    if (!name_ua) rowErrors.push(`Рядок ${rowNum}: відсутня назва (укр)`);

    const name_ru = raw.name_ru ?? "";

    const brand = (raw.brand ?? "").trim();
    if (!brand) rowErrors.push(`Рядок ${rowNum}: відсутній бренд`);

    const category_slug = (raw.category_slug ?? "").trim();
    if (!category_slug) rowErrors.push(`Рядок ${rowNum}: відсутня категорія`);

    const priceRaw = (raw.price ?? "").trim();
    let price = 0;
    if (!NON_NEGATIVE_INT.test(priceRaw)) {
      rowErrors.push(`Рядок ${rowNum}: ціна має бути цілим невід'ємним числом`);
    } else {
      price = Number(priceRaw);
    }

    const oldPriceRaw = (raw.old_price ?? "").trim();
    let old_price: number | null = null;
    if (oldPriceRaw !== "") {
      if (!NON_NEGATIVE_INT.test(oldPriceRaw)) {
        rowErrors.push(`Рядок ${rowNum}: стара ціна має бути цілим невід'ємним числом`);
      } else {
        old_price = Number(oldPriceRaw);
      }
    }

    const stockRaw = (raw.stock_status ?? "").trim();
    let stock_status: StockStatus = "in_stock";
    if (stockRaw !== "") {
      if (!STOCK_STATUSES.includes(stockRaw as StockStatus)) {
        rowErrors.push(`Рядок ${rowNum}: невідомий статус наявності "${stockRaw}"`);
      } else {
        stock_status = stockRaw as StockStatus;
      }
    }

    const isHitParsed = parseBoolField(raw.is_hit);
    let is_hit = false;
    if (!isHitParsed.ok) {
      rowErrors.push(`Рядок ${rowNum}: некоректне значення is_hit "${raw.is_hit ?? ""}"`);
    } else {
      is_hit = isHitParsed.value;
    }

    const isSaleParsed = parseBoolField(raw.is_sale);
    let is_sale = false;
    if (!isSaleParsed.ok) {
      rowErrors.push(`Рядок ${rowNum}: некоректне значення is_sale "${raw.is_sale ?? ""}"`);
    } else {
      is_sale = isSaleParsed.value;
    }

    const description_ua = raw.description_ua ?? "";
    const description_ru = raw.description_ru ?? "";

    if (slug) {
      if (seenSlugs.has(slug)) {
        rowErrors.push(`Рядок ${rowNum}: дублікат slug "${slug}"`);
      } else {
        seenSlugs.add(slug);
      }
    }

    if (rowErrors.length > 0) {
      errors.push(...rowErrors);
      return;
    }

    rows.push({
      slug,
      name_ua,
      name_ru,
      brand,
      category_slug,
      price,
      old_price,
      stock_status,
      is_hit,
      is_sale,
      description_ua,
      description_ru,
    });
  });

  if (errors.length > MAX_ERRORS) {
    const remaining = errors.length - MAX_ERRORS;
    const capped = errors.slice(0, MAX_ERRORS);
    capped.push(`…і ще ${remaining}`);
    return { rows, errors: capped };
  }

  return { rows, errors };
}

/** Serializes products to the same CSV shape parseProductsCsv reads, CRLF + BOM (Excel-friendly). */
export function productsToCsv(products: ProductLike[]): string {
  const data = products.map((p) => [
    p.slug,
    p.name_ua,
    p.name_ru,
    p.brand,
    p.category_slug,
    String(p.price),
    p.old_price == null ? "" : String(p.old_price),
    p.stock_status,
    p.is_hit ? "true" : "false",
    p.is_sale ? "true" : "false",
    p.description_ua,
    p.description_ru,
  ]);

  const csvBody = Papa.unparse(
    { fields: CSV_COLUMNS as unknown as string[], data },
    { newline: "\r\n" }
  );

  return BOM + csvBody;
}
