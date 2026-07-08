import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { demoProducts, isDemoMode } from "@/lib/demo";
import { orderSchema } from "@/lib/order-schema";
import { sendOrderNotification } from "@/lib/telegram";
import type { OrderItem, PaymentStatus, Product } from "@/lib/types";

/** POST /api/orders — creates an order and (in real mode) notifies Telegram. */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
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
        return NextResponse.json({ error: `Unknown product: ${item.slug}` }, { status: 400 });
      }
      if (product.stock_status === "out_of_stock") {
        return NextResponse.json({ error: `Out of stock: ${item.slug}` }, { status: 400 });
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
    return NextResponse.json({ error: "Failed to load products" }, { status: 500 });
  }

  const bySlug = new Map((products as Product[]).map((p) => [p.slug, p]));
  const snapshot: OrderItem[] = [];
  let total = 0;

  for (const item of items) {
    const product = bySlug.get(item.slug);
    if (!product) {
      return NextResponse.json({ error: `Unknown product: ${item.slug}` }, { status: 400 });
    }
    if (product.stock_status === "out_of_stock") {
      return NextResponse.json({ error: `Out of stock: ${item.slug}` }, { status: 400 });
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
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
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

  // TODO(Task 9): create a real Monobank invoice for paymentMethod === 'mono'
  // and return its payUrl here; for now checkout falls back to the thanks page.
  const payUrl: string | null = null;

  return NextResponse.json({ orderId: order.id, payUrl });
}
