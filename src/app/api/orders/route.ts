import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { demoProducts, isDemoMode } from "@/lib/demo";
import { orderSchema } from "@/lib/order-schema";
import { sendOrderNotification } from "@/lib/telegram";
import { createInvoice } from "@/lib/mono";
import type { OrderItem, PaymentStatus, Product } from "@/lib/types";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Module scope → warns once per server process, not per request.
if (!process.env.NEXT_PUBLIC_SITE_URL && process.env.NODE_ENV !== "development") {
  console.warn(
    "POST /api/orders: NEXT_PUBLIC_SITE_URL is not set — mono redirect/webhook URLs will point at localhost"
  );
}

/**
 * POST /api/orders — creates an order and (in real mode) notifies Telegram.
 * Error responses carry machine codes ({error: 'invalid'|'unknown_product'|
 * 'out_of_stock'|'internal', slug?}) — the client maps them to localized copy,
 * so no user-facing prose lives here.
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const { customer, items, paymentMethod } = parsed.data;
  const slugs = items.map((item) => item.slug);

  // DEMO MODE: no Supabase env configured yet. Preview the full checkout flow
  // (validate against seed data, compute a total) without touching a DB or
  // sending a real Telegram message.
  if (isDemoMode()) {
    const bySlug = new Map(demoProducts.map((p) => [p.slug, p]));
    for (const item of items) {
      const product = bySlug.get(item.slug);
      if (!product) {
        return NextResponse.json({ error: "unknown_product", slug: item.slug }, { status: 400 });
      }
      if (product.stock_status === "out_of_stock") {
        return NextResponse.json({ error: "out_of_stock", slug: item.slug }, { status: 400 });
      }
    }

    return NextResponse.json({ orderId: -(Date.now() % 100000), payUrl: null });
  }

  const supabase = createAdminClient();

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("*")
    .in("slug", slugs);

  if (productsError || !products) {
    console.error("POST /api/orders: failed to load products", productsError?.message);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }

  const bySlug = new Map((products as Product[]).map((p) => [p.slug, p]));
  const snapshot: OrderItem[] = [];
  let total = 0;

  for (const item of items) {
    const product = bySlug.get(item.slug);
    if (!product) {
      return NextResponse.json({ error: "unknown_product", slug: item.slug }, { status: 400 });
    }
    if (product.stock_status === "out_of_stock") {
      return NextResponse.json({ error: "out_of_stock", slug: item.slug }, { status: 400 });
    }
    // Total is always recomputed server-side from DB prices — never trust the client.
    total += product.price * item.qty;
    snapshot.push({ slug: product.slug, name: product.name_ua, price: product.price, qty: item.qty });
  }

  const paymentStatus: PaymentStatus = paymentMethod === "mono" ? "pending" : "n/a";

  const { data: order, error: insertError } = await supabase
    .from("orders")
    .insert({
      name: customer.name,
      phone: customer.phone,
      city: customer.city,
      np_office: customer.npOffice ?? "",
      comment: customer.comment ?? "",
      items: snapshot,
      total,
      payment_method: paymentMethod,
      payment_status: paymentStatus,
      order_status: "new",
    })
    .select("id")
    .single();

  if (insertError || !order) {
    console.error("POST /api/orders: insert failed", insertError?.message);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }

  // Never throws — a failed Telegram notification must not fail the order.
  await sendOrderNotification({
    id: order.id,
    name: customer.name,
    phone: customer.phone,
    city: customer.city,
    npOffice: customer.npOffice ?? "",
    comment: customer.comment ?? "",
    items: snapshot,
    total,
    paymentMethod,
  });

  let payUrl: string | null = null;

  if (paymentMethod === "mono") {
    const invoice = await createInvoice({
      amountUah: total,
      orderId: order.id,
      redirectUrl: `${SITE_URL}/order/${order.id}/thanks`,
      webhookUrl: `${SITE_URL}/api/mono-webhook`,
    });

    if (invoice) {
      payUrl = invoice.pageUrl;
      // If this update is lost, the customer can still pay but the webhook
      // will never match the order (it looks up by mono_invoice_id) — so
      // retry once; if the retry also fails, log BOTH ids prominently so
      // staff can reconcile manually via merchantPaymInfo.reference (= orderId).
      const saveInvoiceId = () =>
        supabase.from("orders").update({ mono_invoice_id: invoice.invoiceId }).eq("id", order.id);

      let { error: updateError } = await saveInvoiceId();
      if (updateError) {
        console.error("POST /api/orders: failed to save mono_invoice_id, retrying", updateError.message);
        ({ error: updateError } = await saveInvoiceId());
      }
      if (updateError) {
        console.error(
          `POST /api/orders: RECONCILE MANUALLY — mono_invoice_id not saved after retry. orderId=${order.id} invoiceId=${invoice.invoiceId}`,
          updateError.message
        );
      }
    }
    // invoice === null: monobank unavailable/misconfigured — payUrl stays null,
    // the client falls back to the thanks page, and the order stays 'pending'
    // for manual follow-up (see task brief).
  }

  return NextResponse.json({ orderId: order.id, payUrl });
}
