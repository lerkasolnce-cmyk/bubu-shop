import { notFound } from "next/navigation";
import { z } from "zod";
import { getLocale, getT } from "@/lib/i18n";
import { createServerClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo";
import type { Order } from "@/lib/types";
import OrderStatusSelect, { type OrderStatusLabels } from "@/components/admin/OrderStatusSelect";

// orders.id is a bigint identity, NOT a uuid — coerce+int, never z.uuid() here.
const idSchema = z.coerce.number().int().positive();

async function loadOrder(id: number): Promise<Order | null> {
  if (isDemoMode()) return null;

  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
    if (error || !data) return null;
    return data as Order;
  } catch {
    return null;
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idRaw } = await params;
  const parsedId = idSchema.safeParse(idRaw);
  if (!parsedId.success) notFound();

  const t = getT(await getLocale());
  const order = await loadOrder(parsedId.data);
  if (!order) notFound();

  const statusLabels: OrderStatusLabels = {
    new: t("admin.orders.statusNew"),
    confirmed: t("admin.orders.statusConfirmed"),
    shipped: t("admin.orders.statusShipped"),
    done: t("admin.orders.statusDone"),
    cancelled: t("admin.orders.statusCancelled"),
    updateError: t("admin.orders.updateError"),
  };

  const paymentStatusLabel: Record<Order["payment_status"], string> = {
    paid: t("admin.orders.paymentStatusPaid"),
    pending: t("admin.orders.paymentStatusPending"),
    failed: t("admin.orders.paymentStatusFailed"),
    "n/a": t("admin.orders.paymentStatusNA"),
  };

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">
            {t("admin.orders.orderTitle")} #{order.id}
          </h1>
          <p className="text-sm text-ink/50">{formatDate(order.created_at)}</p>
        </div>
        <OrderStatusSelect id={order.id} status={order.order_status} labels={statusLabels} />
      </div>

      <section className="rounded-lg border border-blush/40 bg-white p-4">
        <h2 className="mb-3 text-sm font-bold text-ink">{t("admin.orders.customerTitle")}</h2>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-ink/50">{t("admin.orders.name")}</dt>
            <dd className="font-semibold text-ink">{order.name}</dd>
          </div>
          <div>
            <dt className="text-ink/50">{t("admin.orders.phone")}</dt>
            <dd>
              <a href={`tel:${order.phone}`} className="font-semibold text-ink hover:underline">
                {order.phone}
              </a>
            </dd>
          </div>
          <div>
            <dt className="text-ink/50">{t("admin.orders.city")}</dt>
            <dd className="font-semibold text-ink">{order.city}</dd>
          </div>
          <div>
            <dt className="text-ink/50">{t("admin.orders.npOffice")}</dt>
            <dd className="font-semibold text-ink">{order.np_office || "—"}</dd>
          </div>
          {order.comment && (
            <div className="sm:col-span-2">
              <dt className="text-ink/50">{t("admin.orders.comment")}</dt>
              <dd className="text-ink">{order.comment}</dd>
            </div>
          )}
        </dl>
      </section>

      <section className="rounded-lg border border-blush/40 bg-white p-4">
        <h2 className="mb-3 text-sm font-bold text-ink">{t("admin.orders.itemsTitle")}</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-blush/40 text-left text-xs font-semibold uppercase tracking-wide text-ink/50">
              <th className="py-2">{t("admin.orders.colItemName")}</th>
              <th className="py-2 text-right">{t("admin.orders.colItemPrice")}</th>
              <th className="py-2 text-right">{t("admin.orders.colItemQty")}</th>
              <th className="py-2 text-right">{t("admin.orders.colItemTotal")}</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={`${item.slug}-${i}`} className="border-b border-blush/20 last:border-0">
                <td className="py-2 text-ink">{item.name}</td>
                <td className="py-2 text-right text-ink/70">₴{item.price.toLocaleString("uk-UA")}</td>
                <td className="py-2 text-right text-ink/70">{item.qty}</td>
                <td className="py-2 text-right font-semibold text-ink">
                  ₴{(item.price * item.qty).toLocaleString("uk-UA")}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} className="pt-3 text-right text-sm font-bold text-ink">
                {t("admin.orders.grandTotal")}
              </td>
              <td className="pt-3 text-right text-lg font-extrabold text-ink">
                ₴{order.total.toLocaleString("uk-UA")}
              </td>
            </tr>
          </tfoot>
        </table>
      </section>

      <section className="rounded-lg border border-blush/40 bg-white p-4">
        <h2 className="mb-3 text-sm font-bold text-ink">{t("admin.orders.paymentTitle")}</h2>
        <dl className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-ink/50">{t("admin.orders.paymentMethod")}</dt>
            <dd className="font-semibold text-ink">
              {order.payment_method === "mono" ? t("admin.orders.paymentMono") : t("admin.orders.paymentCod")}
            </dd>
          </div>
          <div>
            <dt className="text-ink/50">{t("admin.orders.paymentStatus")}</dt>
            <dd className="font-semibold text-ink">{paymentStatusLabel[order.payment_status]}</dd>
          </div>
          {order.mono_invoice_id && (
            <div className="sm:col-span-2">
              <dt className="text-ink/50">{t("admin.orders.invoiceId")}</dt>
              <dd className="font-mono text-xs text-ink/70">{order.mono_invoice_id}</dd>
            </div>
          )}
        </dl>
      </section>
    </div>
  );
}
