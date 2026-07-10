"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { productsToCsv, type ProductCsvRow, type ProductLike } from "@/lib/csv";
import type { Product } from "@/lib/types";

const STOCK_STATUSES = ["in_stock", "preorder", "out_of_stock"] as const;
const BATCH_SIZE = 500;
const EXPORT_PAGE_SIZE = 1000;

// parseProductsCsv() already guarantees this shape client-side, but Server Actions are
// reachable via a forged direct POST too, so the payload is re-validated here just like
// saveProduct/saveCategory validate FormData.
const csvRowSchema = z.object({
  slug: z.string().trim().min(1),
  name_ua: z.string().trim().min(1),
  name_ru: z.string(),
  brand: z.string().trim().min(1),
  category_slug: z.string().trim().min(1),
  price: z.number().int().min(0),
  old_price: z.number().int().min(0).nullable(),
  stock_status: z.enum(STOCK_STATUSES),
  is_hit: z.boolean(),
  is_sale: z.boolean(),
  description_ua: z.string(),
  description_ru: z.string(),
});

export type SkippedRow = { row: number; reason: string };

export type ImportResult = {
  ok: boolean;
  error?: string;
  created?: number;
  updated?: number;
  skipped?: SkippedRow[];
};

export type ExportResult = { ok: boolean; csv?: string; error?: string };

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * Upserts CSV rows into products, keyed by slug. Auth is re-checked here (defense in
 * depth, same reasoning as products/actions.ts) since Server Actions are reachable via
 * direct POST too.
 *
 * Rows with a category_slug that doesn't match any category are skipped (reason
 * 'unknown_category') rather than failing the whole import — a shop owner uploading
 * 2-3k rows needs partial success, not an all-or-nothing wall.
 *
 * created/updated counts come from a pre-upsert `.in('slug', batchSlugs)` lookup per
 * batch: slugs found there become "updated", the rest "created".
 *
 * The upsert payload deliberately omits images/specs. With `ignoreDuplicates: false`
 * (the default) supabase-js sends `Prefer: resolution=merge-duplicates`, and PostgREST's
 * merge-duplicates resolution only SETs the columns present in the payload on conflict —
 * columns left out (images/specs) are untouched on an update, never nulled. `defaultToNull:
 * false` additionally sends `Prefer: missing=default`, so on INSERT (new slug) the omitted
 * images/specs columns fall back to their table defaults ('{}'/'{}') instead of NULL.
 * Verified against the upsert() docblock in
 * node_modules/@supabase/postgrest-js/src/PostgrestQueryBuilder.ts (defaultToNull param
 * description + the Prefer header lines right below it).
 */
export async function importProducts(rows: ProductCsvRow[]): Promise<ImportResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  if (!Array.isArray(rows) || rows.length === 0) {
    return { ok: true, created: 0, updated: 0, skipped: [] };
  }

  const { data: categoriesData, error: categoriesError } = await supabase
    .from("categories")
    .select("id, slug");
  if (categoriesError) {
    console.error("importProducts: categories lookup failed", categoriesError.message);
    return { ok: false, error: "unknown" };
  }
  const categoryIdBySlug = new Map<string, string>(
    ((categoriesData ?? []) as { id: string; slug: string }[]).map((c) => [c.slug, c.id])
  );

  const skipped: SkippedRow[] = [];
  const mapped: { row: ProductCsvRow; category_id: string }[] = [];

  rows.forEach((raw, i) => {
    const rowNum = i + 1;
    const parsed = csvRowSchema.safeParse(raw);
    if (!parsed.success) {
      skipped.push({ row: rowNum, reason: "invalid_row" });
      return;
    }
    const row = parsed.data;
    const category_id = categoryIdBySlug.get(row.category_slug);
    if (!category_id) {
      skipped.push({ row: rowNum, reason: "unknown_category" });
      return;
    }
    mapped.push({ row, category_id });
  });

  let created = 0;
  let updated = 0;

  for (const batch of chunk(mapped, BATCH_SIZE)) {
    const slugs = batch.map((m) => m.row.slug);

    const { data: existing, error: existingError } = await supabase
      .from("products")
      .select("slug")
      .in("slug", slugs);
    if (existingError) {
      console.error("importProducts: existing-slug lookup failed", existingError.message);
      return { ok: false, error: "unknown" };
    }
    const existingSlugs = new Set(((existing ?? []) as { slug: string }[]).map((r) => r.slug));

    const payload = batch.map((m) => ({
      slug: m.row.slug,
      name_ua: m.row.name_ua,
      name_ru: m.row.name_ru,
      brand: m.row.brand,
      category_id: m.category_id,
      price: m.row.price,
      old_price: m.row.old_price,
      stock_status: m.row.stock_status,
      is_hit: m.row.is_hit,
      is_sale: m.row.is_sale,
      description_ua: m.row.description_ua,
      description_ru: m.row.description_ru,
    }));

    const { error: upsertError } = await supabase
      .from("products")
      .upsert(payload, { onConflict: "slug", ignoreDuplicates: false, defaultToNull: false });
    if (upsertError) {
      console.error("importProducts: upsert failed", upsertError.message);
      return { ok: false, error: "unknown" };
    }

    for (const m of batch) {
      if (existingSlugs.has(m.row.slug)) updated++;
      else created++;
    }
  }

  revalidatePath("/admin/products");
  revalidatePath("/", "layout");

  return { ok: true, created, updated, skipped };
}

/** Fetches all products (paged 1000 at a time) and serializes them to the same CSV shape importProducts reads. */
export async function exportProducts(): Promise<ExportResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { data: categoriesData, error: categoriesError } = await supabase
    .from("categories")
    .select("id, slug");
  if (categoriesError) {
    console.error("exportProducts: categories lookup failed", categoriesError.message);
    return { ok: false, error: "unknown" };
  }
  const categorySlugById = new Map<string, string>(
    ((categoriesData ?? []) as { id: string; slug: string }[]).map((c) => [c.id, c.slug])
  );

  const all: ProductLike[] = [];
  for (let from = 0; ; from += EXPORT_PAGE_SIZE) {
    const to = from + EXPORT_PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: true })
      .range(from, to);
    if (error) {
      console.error("exportProducts: fetch failed", error.message);
      return { ok: false, error: "unknown" };
    }
    const page = (data ?? []) as Product[];
    for (const p of page) {
      all.push({
        slug: p.slug,
        name_ua: p.name_ua,
        name_ru: p.name_ru,
        brand: p.brand,
        category_slug: p.category_id ? (categorySlugById.get(p.category_id) ?? "") : "",
        price: p.price,
        old_price: p.old_price,
        stock_status: p.stock_status,
        is_hit: p.is_hit,
        is_sale: p.is_sale,
        description_ua: p.description_ua,
        description_ru: p.description_ru,
      });
    }
    if (page.length < EXPORT_PAGE_SIZE) break;
  }

  return { ok: true, csv: productsToCsv(all) };
}
