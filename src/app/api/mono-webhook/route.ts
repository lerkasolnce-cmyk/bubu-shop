import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDemoMode } from "@/lib/demo";
import { verifyWebhookSignature } from "@/lib/mono";
import type { PaymentStatus } from "@/lib/types";

interface MonoWebhookPayload {
  invoiceId?: string;
  status?: string;
  reference?: string;
  amount?: number;
}

const STATUS_MAP: Record<string, PaymentStatus> = {
  success: "paid",
  failure: "failed",
  expired: "failed",
};

/**
 * POST /api/mono-webhook — monobank notifies invoice status changes here.
 * Signature is verified over the RAW body (before any JSON parsing) using
 * the merchant public key (env MONO_PUB_KEY). An unset/wrong key or a bad
 * signature is always rejected with 401 — we never accept unsigned payment
 * updates, even if that means treating "not configured yet" as "reject".
 * Monobank retries on any non-200, so once the signature checks out we
 * always answer 200 to avoid retry storms, even if the payload turns out
 * to describe a status we don't act on.
 */
export async function POST(request: NextRequest) {
  const raw = await request.text();
  const xSign = request.headers.get("x-sign") ?? "";
  const pubKey = process.env.MONO_PUB_KEY ?? "";

  if (!verifyWebhookSignature(raw, xSign, pubKey)) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let payload: MonoWebhookPayload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const newStatus = payload.status ? STATUS_MAP[payload.status] : undefined;
  if (!payload.invoiceId || !newStatus || isDemoMode()) {
    // Nothing to update (unhandled status like 'created'/'processing', or
    // demo mode has no DB to touch) — still a valid, handled notification.
    return NextResponse.json({ ok: true });
  }

  const supabase = createAdminClient();
  // Idempotent: only flips rows that aren't already 'paid', so a retried or
  // out-of-order webhook can't clobber a settled order.
  const { error } = await supabase
    .from("orders")
    .update({ payment_status: newStatus })
    .eq("mono_invoice_id", payload.invoiceId)
    .neq("payment_status", "paid");

  if (error) {
    console.error("POST /api/mono-webhook: update failed", error.message);
  }

  return NextResponse.json({ ok: true });
}
