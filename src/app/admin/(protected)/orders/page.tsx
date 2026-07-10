import Link from "next/link";
import { getLocale, getT } from "@/lib/i18n";
import { createServerClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo";
import type { Order, OrderStatus } from "@/lib/types";
import Pagination from "@/components/Pagination";
import OrderStatusSelect, { type OrderStatusLabels } from "@/components/admin/OrderStatusSelect";

const PAGE_SIZE = 50;
const STATUSES: OrderStatus[] = ["new", "confirmed", "shipped", "done", "cancelled"];

const PAYMENT_BADGE: Record<Order["payment_status"], string> = {
  paid: "bg-mint/50 text-ink",
  pending: "bg-amber-100 text-amber-800",
  failed: "bg-red-100 text-red-700",
  "n/a": "bg-ink/10 text-ink/50",
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

async function loadOrders(status: OrderStatus | undefined, page: number): Promise<{ items: Order[]; total: number }> {
  // Demo mode is unreachable (layout redirects to login), but this must never crash without env.
  if (isDemoMode()) return { items: [], total: 0 };

  try {
    const supabase = await createServerClient();
    let builder = supabase.from("orders").select("*", { count: "exact" }).order("created_at", { ascending: false });
    if (status) builder = builder.eq("order_status", status);

    const from = (page - 1) * PAGE_SIZE;
    const to = page * PAGE_SIZE - 1;
    builder = builder.range(from, to);

    const { data, error, count } = await builder;
    if (error || !data) {
      if (error) console.error("loadOrders:", error.message);
      return { items: [], total: 0 };
    }
    return { items: data as Order[], total: count ?? 0 };
  } catch (e) {
    console.error("loadOrders:", e);
    return { items: [], total: 0 };
  }
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const t = getT(await getLocale());

  const statusRaw = firstParam(sp.status);
  const status = (STATUSES as string[]).includes(statusRaw ?? "") ? (statusRaw as OrderStatus) : undefined;
  const pageRaw = firstParam(sp.page);
  const pageNum = pageRaw ? parseInt(pageRaw, 10) : 1;
  const page = Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1;

  const { items, total } = await loadOrders(status, page);

  const statusLabels: OrderStatusLabels = {
    new: t("admin.orders.statusNew"),
    confirmed: t("admin.orders.statusConfirmed"),
    shipped: t("admin.orders.statusShipped"),
    done: t("admin.orders.statusDone"),
    cancelled: t("admin.orders.statusCancelled"),
    updateError: t("admin.orders.updateError"),
  };

  function makeHref(overrides: { status?: string; page?: number }): string {
    const params = new URLSearchParams();
    const nextStatus = overrides.status !== undefined ? overrides.status : (status ?? "");
    if (nextStatus) params.set("status", nextStatus);
    const nextPage = overrides.page ?? page;
    if (nextPage > 1) params.set("page", String(nextPage));
    const qs = params.toString();
    return qs ? `/admin/orders?${qs}` : "/admin/orders";
  }

  const tabs: { key: OrderStatus | undefined; label: string }[] = [
    { key: undefined, label: t("admin.orders.tabAll") },
    { key: "new", label: t("admin.orders.tabNew") },
    { key: "confirmed", label: t("admin.orders.tabConfirmed") },
    { key: "shipped", label: t("admin.orders.tabShipped") },
    { key: "done", label: t("admin.orders.tabDone") },
    { key: "cancelled", label: t("admin.orders.tabCancelled") },
  ];

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold text-ink">{t("admin.nav.orders")}</h1>

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const active = tab.key === status;
          return (
            <Link
              key={tab.key ?? "all"}
              href={makeHref({ status: tab.key ?? "", page: 1 })}
              className={
                active
                  ? "rounded-full bg-ink px-3 py-1.5 text-sm font-bold text-white"
                  : "rounded-full border border-blush/60 bg-white px-3 py-1.5 text-sm font-semibold text-ink hover:bg-blush/20"
              }
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      {items.length === 0 ? (
        <p className="rounded-lg border border-blush/40 bg-white p-6 text-center text-sm text-ink/60">
          {t("admin.orders.empty")}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-blush/40 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-blush/40 text-left text-xs font-semibold uppercase tracking-wide text-ink/50">
                <th className="px-3 py-2">{t("admin.orders.colNumber")}</th>
                <th className="px-3 py-2">{t("admin.orders.colDate")}</th>
                <th className="px-3 py-2">{t("admin.orders.colName")}</th>
                <th className="px-3 py-2">{t("admin.orders.colPhone")}</th>
                <th className="px-3 py-2">{t("admin.orders.colTotal")}</th>
                <th className="px-3 py-2">{t("admin.orders.colPayment")}</th>
                <th className="px-3 py-2">{t("admin.orders.colStatus")}</th>
                <th className="px-3 py-2 text-right">{t("admin.orders.colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((o) => (
                <tr key={o.id} className="border-b border-blush/20 last:border-0">
                  <td className="px-3 py-2 font-semibold text-ink">#{o.id}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-ink/70">{formatDate(o.created_at)}</td>
                  <td className="px-3 py-2 text-ink">{o.name}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <a href={`tel:${o.phone}`} className="text-ink/70 hover:text-ink hover:underline">
                      {o.phone}
                    </a>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap font-bold text-ink">
                    ₴{o.total.toLocaleString("uk-UA")}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${PAYMENT_BADGE[o.payment_status]}`}
                    >
                      {o.payment_method === "mono" ? t("admin.orders.paymentMono") : t("admin.orders.paymentCod")}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <OrderStatusSelect id={o.id} status={o.order_status} labels={statusLabels} />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="rounded-md border border-blush/60 px-2.5 py-1 text-xs font-semibold text-ink hover:bg-blush/20"
                    >
                      {t("admin.orders.details")}
                    </Link>
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
        makeHref={(p) => makeHref({ page: p })}
        prevLabel={t("catalog.prev")}
        nextLabel={t("catalog.next")}
      />
    </div>
  );
}
