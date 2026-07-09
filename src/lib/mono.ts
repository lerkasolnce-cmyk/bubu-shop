import { createVerify } from "crypto";

// Note: deliberately NOT `import "server-only"` here — verifyWebhookSignature
// is unit-tested directly (tests/mono.test.ts), and that package throws
// unconditionally outside Next's webpack bundler. Both createInvoice and
// verifyWebhookSignature are only ever called from API routes anyway
// (src/app/api/orders, src/app/api/mono-webhook), which already run
// server-side only.

const MONO_INVOICE_CREATE_URL = "https://api.monobank.ua/api/merchant/invoice/create";
const INVOICE_VALIDITY_SECONDS = 60 * 60 * 24; // 24h

export interface CreateInvoiceOptions {
  amountUah: number;
  orderId: number | string;
  redirectUrl: string;
  webhookUrl: string;
  destination?: string;
}

export interface CreateInvoiceResult {
  invoiceId: string;
  pageUrl: string;
}

/**
 * Creates a monobank acquiring invoice for an order.
 * Never throws: a missing token or a failed API call must not break checkout —
 * the caller falls back to `payUrl: null` and the order stays pending for
 * manual follow-up. Errors are logged via console.error.
 */
export async function createInvoice(opts: CreateInvoiceOptions): Promise<CreateInvoiceResult | null> {
  const token = process.env.MONOBANK_TOKEN;
  if (!token) {
    console.error("createInvoice: MONOBANK_TOKEN is not set");
    return null;
  }

  try {
    const res = await fetch(MONO_INVOICE_CREATE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Token": token,
      },
      body: JSON.stringify({
        amount: Math.round(opts.amountUah * 100),
        ccy: 980,
        merchantPaymInfo: {
          reference: String(opts.orderId),
          destination: opts.destination ?? `Оплата замовлення №${opts.orderId}`,
        },
        redirectUrl: opts.redirectUrl,
        webHookUrl: opts.webhookUrl,
        validity: INVOICE_VALIDITY_SECONDS,
      }),
      // A hung monobank API must not hang POST /api/orders: abort after 8s →
      // caught by the try/catch below → null → checkout falls back gracefully.
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      console.error("createInvoice: monobank API responded with", res.status, await res.text());
      return null;
    }

    const data = await res.json();
    if (!data?.invoiceId || !data?.pageUrl) {
      console.error("createInvoice: unexpected monobank response shape", data);
      return null;
    }

    return { invoiceId: data.invoiceId, pageUrl: data.pageUrl };
  } catch (e) {
    console.error("createInvoice: request failed", e);
    return null;
  }
}

/**
 * Verifies the X-Sign header monobank sends on webhook requests.
 * `publicKeyBase64` is the merchant public key as returned by
 * GET /api/merchant/pubkey: a base64 string that decodes to a PEM-encoded
 * EC public key. The signature is ECDSA-SHA256 over the raw request body
 * (base64-encoded DER). Never throws — any decode/verify error is treated
 * as an invalid signature so callers can safely reject with 401.
 */
export function verifyWebhookSignature(rawBody: string, xSignBase64: string, publicKeyBase64: string): boolean {
  try {
    if (!rawBody || !xSignBase64 || !publicKeyBase64) return false;

    const publicKeyPem = Buffer.from(publicKeyBase64, "base64").toString("utf8");
    const verifier = createVerify("SHA256");
    verifier.update(rawBody);
    verifier.end();

    return verifier.verify({ key: publicKeyPem }, xSignBase64, "base64");
  } catch {
    return false;
  }
}
