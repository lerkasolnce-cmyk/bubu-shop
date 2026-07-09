import Link from "next/link";
import Image from "next/image";
import { getLocale, getT } from "@/lib/i18n";
import { createServerClient } from "@/lib/supabase/server";
import { demoProducts, isDemoMode } from "@/lib/demo";
import { fetchCategories, sanitizeSearchTerm } from "@/lib/catalog";
import type { Product } from "@/lib/types";
import Pagination from "@/components/Pagination";
import DeleteProductButton from "@/components/admin/DeleteProductButton";

const PAGE_SIZE = 50;

const STOCK_BADGE: Record<Product["stock_status"], string> = {
  in_stock: "bg-mint/50 text-ink",
  preorder: "bg-accent/20 text-ink",
  out_of_stock: "bg-ink/10 text-ink/50",
};

function stockLabel(t: (key: string) => string, status: Product["stock_status"]): string {
  if (status === "in_stock") return t("product.inStock");
  if (status === "preorder") return t("product.preorder");
  return t("product.outOfStock");
}

async function loadProducts(
  q: string | undefined,
  categoryId: string | undefined,
  page: number
): Promise<{ items: Product[]; total: number }> {
  if (isDemoMode()) {
    let items = demoProducts.slice();
    if (categoryId) items = items.filter((p) => p.category_id === categoryId);
    const term = q ? sanitizeSearchTerm(q).toLowerCase() : "";
    if (term) items = items.filter((p) => (p.name_ua + " " + p.name_ru).toLowerCase().includes(term));
    const total = items.length;
    return { items: items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE), total };
  }

  try {
    const supabase = await createServerClient();
    let builder = supabase.from("products").select("*", { count: "exact" }).order("created_at", { ascending: false });

    if (categoryId) builder = builder.eq("category_id", categoryId);
    const term = q ? sanitizeSearchTerm(q) : "";
    if (term) builder = builder.or(`name_ua.ilike.%${term}%,name_ru.ilike.%${term}%`);

    const from = (page - 1) * PAGE_SIZE;
    const to = page * PAGE_SIZE - 1;
    builder = builder.range(from, to);

    const { data, error, count } = await builder;
    if (error || !data) return { items: [], total: 0 };
    return { items: data as Product[], total: count ?? 0 };
  } catch {
    return { items: [], total: 0 };
  }
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const t = getT(await getLocale());

  const q = firstParam(sp.q)?.trim() || undefined;
  const categoryId = firstParam(sp.category) || undefined;
  const pageRaw = firstParam(sp.page);
  const pageNum = pageRaw ? parseInt(pageRaw, 10) : 1;
  const page = Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1;

  const [categories, { items, total }] = await Promise.all([fetchCategories(), loadProducts(q, categoryId, page)]);

  function makeHref(page: number): string {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (categoryId) params.set("category", categoryId);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    return qs ? `/admin/products?${qs}` : "/admin/products";
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-ink">{t("admin.nav.products")}</h1>
        <Link
          href="/admin/products/new"
          className="rounded-full bg-ink px-4 py-2 text-sm font-bold text-white transition hover:opacity-90"
        >
          {t("admin.products.add")}
        </Link>
      </div>

      <form className="flex flex-wrap gap-3">
        <input
          type="text"
          name="q"
          defaultValue={q ?? ""}
          placeholder={t("admin.products.searchPlaceholder")}
          className="min-w-0 flex-1 rounded-md border border-ink/15 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-mint focus:outline-none"
        />
        <select
          name="category"
          defaultValue={categoryId ?? ""}
          className="rounded-md border border-ink/15 bg-white px-3 py-2 text-sm text-ink focus:border-mint focus:outline-none"
        >
          <option value="">{t("admin.products.categoryAll")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name_ua}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-md border border-blush/60 bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-blush/20"
        >
          {t("catalog.apply")}
        </button>
      </form>

      {items.length === 0 ? (
        <p className="rounded-lg border border-blush/40 bg-white p-6 text-center text-sm text-ink/60">
          {t("admin.products.empty")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-blush/40 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-blush/40 text-left text-xs font-semibold uppercase tracking-wide text-ink/50">
                <th className="px-3 py-2">{t("admin.products.colPhoto")}</th>
                <th className="px-3 py-2">{t("admin.products.colName")}</th>
                <th className="px-3 py-2">{t("admin.products.colBrand")}</th>
                <th className="px-3 py-2">{t("admin.products.colPrice")}</th>
                <th className="px-3 py-2">{t("admin.products.colStock")}</th>
                <th className="px-3 py-2">{t("admin.products.colBadges")}</th>
                <th className="px-3 py-2 text-right">{t("admin.products.colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => (
                <tr key={p.id} className="border-b border-blush/20 last:border-0">
                  <td className="px-3 py-2">
                    <div className="relative h-12 w-12 overflow-hidden rounded-md border border-blush/40 bg-cream">
                      {p.images?.[0] && <Image src={p.images[0]} alt="" fill sizes="48px" className="object-cover" />}
                    </div>
                  </td>
                  <td className="px-3 py-2 font-semibold text-ink">{p.name_ua}</td>
                  <td className="px-3 py-2 text-ink/70">{p.brand}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <span className="font-bold text-ink">₴{p.price.toLocaleString("uk-UA")}</span>
                    {p.old_price != null && (
                      <span className="ml-1.5 text-xs text-ink/40 line-through">
                        ₴{p.old_price.toLocaleString("uk-UA")}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STOCK_BADGE[p.stock_status]}`}
                    >
                      {stockLabel(t, p.stock_status)}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex gap-1.5">
                      {p.is_hit && <span title={t("badge.hit")} className="h-2 w-2 rounded-full bg-accent" />}
                      {p.is_sale && <span title={t("badge.sale")} className="h-2 w-2 rounded-full bg-mint" />}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="rounded-md border border-blush/60 px-2.5 py-1 text-xs font-semibold text-ink hover:bg-blush/20"
                      >
                        {t("admin.products.edit")}
                      </Link>
                      <DeleteProductButton
                        id={p.id}
                        label={t("admin.products.delete")}
                        confirmLabel={t("admin.products.deleteConfirm")}
                        errorLabel={t("admin.products.deleteError")}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
        makeHref={makeHref}
        prevLabel={t("catalog.prev")}
        nextLabel={t("catalog.next")}
      />
    </div>
  );
}
