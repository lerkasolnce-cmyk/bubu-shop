import { createServerClient } from "@/lib/supabase/server";
import { demoCategories, demoProducts, isDemoMode } from "@/lib/demo";
import type { Category, Product } from "@/lib/types";

export const PAGE_SIZE = 24;

export type SortKey = "new" | "price_asc" | "price_desc" | "hits";

const SORT_KEYS: SortKey[] = ["new", "price_asc", "price_desc", "hits"];

export type ProductQuery = {
  categoryIds?: string[];
  q?: string;
  brands?: string[];
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  saleOnly?: boolean;
  sort: SortKey;
  page: number; // 1-based
};

/**
 * Strips characters that would break PostgREST's `.or()` filter syntax (`, ( )`)
 * or act as ilike wildcards: `%`, `*` (PostgREST alias for `%`) are removed,
 * `_` (single-char wildcard) is replaced with a space so terms still match.
 */
export function sanitizeSearchTerm(q: string): string {
  return q.replace(/[,()%*]/g, "").replace(/_/g, " ").trim();
}

/** In-memory filtering over demo data — preview mode only, mirrors the DB query semantics. */
function fetchProductsDemo(query: ProductQuery): { items: Product[]; total: number } {
  let items = demoProducts.slice();
  if (query.categoryIds?.length) {
    const set = new Set(query.categoryIds);
    items = items.filter((p) => p.category_id != null && set.has(p.category_id));
  }
  if (query.brands?.length) {
    const set = new Set(query.brands.map((b) => b.toLowerCase()));
    items = items.filter((p) => set.has(p.brand.toLowerCase()));
  }
  if (query.minPrice != null) items = items.filter((p) => p.price >= query.minPrice!);
  if (query.maxPrice != null) items = items.filter((p) => p.price <= query.maxPrice!);
  if (query.inStockOnly) items = items.filter((p) => p.stock_status === "in_stock");
  if (query.saleOnly) items = items.filter((p) => p.is_sale);
  const term = query.q ? sanitizeSearchTerm(query.q).toLowerCase() : "";
  if (term) items = items.filter((p) => (p.name_ua + " " + p.name_ru).toLowerCase().includes(term));

  switch (query.sort) {
    case "price_asc":
      items.sort((a, b) => a.price - b.price);
      break;
    case "price_desc":
      items.sort((a, b) => b.price - a.price);
      break;
    case "hits":
      items.sort((a, b) => Number(b.is_hit) - Number(a.is_hit));
      break;
  }

  const total = items.length;
  const page = Math.max(1, query.page);
  return { items: items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), total };
}

export async function fetchProducts(query: ProductQuery): Promise<{ items: Product[]; total: number }> {
  if (isDemoMode()) return fetchProductsDemo(query);

  try {
    const supabase = await createServerClient();
    let builder = supabase.from("products").select("*", { count: "exact" });

    if (query.categoryIds?.length) builder = builder.in("category_id", query.categoryIds);
    if (query.brands && query.brands.length > 0) {
      // The URL carries lowercase brand values (?brand=anex,cybex) while the DB stores "Anex" —
      // match case-insensitively with exact ilike (no wildcards) in an OR-group.
      // Multiple .or() groups (this one + the q group below) are ANDed by PostgREST.
      const group = query.brands
        .map((b) => sanitizeSearchTerm(b))
        .filter(Boolean)
        .map((b) => `brand.ilike.${b}`)
        .join(",");
      if (group) builder = builder.or(group);
    }
    if (query.minPrice != null) builder = builder.gte("price", query.minPrice);
    if (query.maxPrice != null) builder = builder.lte("price", query.maxPrice);
    if (query.inStockOnly) builder = builder.eq("stock_status", "in_stock");
    if (query.saleOnly) builder = builder.eq("is_sale", true);

    const term = query.q ? sanitizeSearchTerm(query.q) : "";
    if (term) {
      builder = builder.or(`name_ua.ilike.%${term}%,name_ru.ilike.%${term}%`);
    }

    switch (query.sort) {
      case "price_asc":
        builder = builder.order("price", { ascending: true });
        break;
      case "price_desc":
        builder = builder.order("price", { ascending: false });
        break;
      case "hits":
        builder = builder.order("is_hit", { ascending: false }).order("created_at", { ascending: false });
        break;
      case "new":
      default:
        builder = builder.order("created_at", { ascending: false });
        break;
    }

    const page = Math.max(1, query.page);
    const from = (page - 1) * PAGE_SIZE;
    const to = page * PAGE_SIZE - 1;
    builder = builder.range(from, to);

    const { data, error, count } = await builder;
    if (error || !data) {
      if (error) console.error("fetchProducts:", error.message);
      return { items: [], total: 0 };
    }
    return { items: data as Product[], total: count ?? 0 };
  } catch (e) {
    console.error("fetchProducts:", e);
    return { items: [], total: 0 };
  }
}

/** Distinct brands, optionally scoped to a set of categories. Fail-soft -> []. */
export async function fetchBrands(categoryIds?: string[]): Promise<string[]> {
  if (isDemoMode()) {
    const scoped = categoryIds?.length
      ? demoProducts.filter((p) => p.category_id != null && categoryIds.includes(p.category_id))
      : demoProducts;
    return Array.from(new Set(scoped.map((p) => p.brand))).sort((a, b) => a.localeCompare(b));
  }

  try {
    const supabase = await createServerClient();
    let builder = supabase.from("products").select("brand");
    if (categoryIds?.length) builder = builder.in("category_id", categoryIds);

    const { data, error } = await builder;
    if (error || !data) {
      if (error) console.error("fetchBrands:", error.message);
      return [];
    }

    const brands = new Set<string>();
    for (const row of data as { brand: string }[]) {
      if (row.brand) brands.add(row.brand);
    }
    return Array.from(brands).sort((a, b) => a.localeCompare(b));
  } catch (e) {
    console.error("fetchBrands:", e);
    return [];
  }
}

/** All categories ordered by `sort`, used by the admin category filter/select. Fail-soft -> []. */
export async function fetchCategories(): Promise<Category[]> {
  if (isDemoMode()) return demoCategories;

  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase.from("categories").select("*").order("sort", { ascending: true });
    if (error || !data) {
      if (error) console.error("fetchCategories:", error.message);
      return [];
    }
    return data as Category[];
  } catch (e) {
    console.error("fetchCategories:", e);
    return [];
  }
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseQueryFromSearchParams(
  sp: Record<string, string | string[] | undefined>
): Omit<ProductQuery, "categoryIds"> {
  const qRaw = firstParam(sp.q)?.trim();
  const q = qRaw ? qRaw : undefined;

  const brandRaw = firstParam(sp.brand);
  const brands = brandRaw
    ? brandRaw
        .split(",")
        .map((b) => b.trim().toLowerCase())
        .filter(Boolean)
    : undefined;

  const minRaw = firstParam(sp.min);
  const minPrice = minRaw !== undefined && minRaw !== "" && !Number.isNaN(Number(minRaw)) ? Math.max(0, Number(minRaw)) : undefined;

  const maxRaw = firstParam(sp.max);
  const maxPrice = maxRaw !== undefined && maxRaw !== "" && !Number.isNaN(Number(maxRaw)) ? Math.max(0, Number(maxRaw)) : undefined;

  const inStockOnly = firstParam(sp.stock) === "1";

  const sortRaw = firstParam(sp.sort);
  const sort: SortKey = SORT_KEYS.includes(sortRaw as SortKey) ? (sortRaw as SortKey) : "new";

  const pageRaw = firstParam(sp.page);
  const pageNum = pageRaw ? parseInt(pageRaw, 10) : 1;
  const page = Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1;

  return { q, brands, minPrice, maxPrice, inStockOnly, sort, page };
}

/** Russian/Ukrainian pluralization bucket: 1 товар / 2 товари / 5 товарів. */
export function pluralKey(n: number): "One" | "Few" | "Many" {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "One";
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return "Few";
  return "Many";
}

/**
 * Builds an href for `basePath` from the current raw searchParams, applying `overrides`
 * (a value of `undefined` removes that param). Used to preserve filters/sort across
 * pagination links rendered on the server.
 */
export function buildHref(
  basePath: string,
  sp: Record<string, string | string[] | undefined>,
  overrides: Record<string, string | undefined> = {}
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    const v = firstParam(value);
    if (v) params.set(key, v);
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) params.delete(key);
    else params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `${basePath}?${qs}` : basePath;
}
