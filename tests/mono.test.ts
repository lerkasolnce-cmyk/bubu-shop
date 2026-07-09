import { describe, it, expect } from "vitest";
import { generateKeyPairSync, createSign } from "crypto";
import { verifyWebhookSignature } from "@/lib/mono";

// Mimics the mono merchant public key format: mono gives us a base64 string
// that decodes to a PEM-encoded EC public key (from GET /api/merchant/pubkey).
function makeKeyPair() {
  const { publicKey, privateKey } = generateKeyPairSync("ec", { namedCurve: "prime256v1" });
  const publicKeyPem = publicKey.export({ type: "spki", format: "pem" }).toString();
  const publicKeyBase64 = Buffer.from(publicKeyPem, "utf8").toString("base64");
  return { privateKey, publicKeyBase64 };
}

function sign(privateKey: import("crypto").KeyObject, body: string): string {
  const signer = createSign("SHA256");
  signer.update(body);
  signer.end();
  return signer.sign(privateKey).toString("base64");
}

describe("verifyWebhookSignature", () => {
  it("returns true for a valid signature over the exact raw body", () => {
    const { privateKey, publicKeyBase64 } = makeKeyPair();
    const body = JSON.stringify({ invoiceId: "abc123", status: "success", reference: "42", amount: 150000 });
    const sig = sign(privateKey, body);

    expect(verifyWebhookSignature(body, sig, publicKeyBase64)).toBe(true);
  });

  it("returns false when the body is tampered after signing", () => {
    const { privateKey, publicKeyBase64 } = makeKeyPair();
    const body = JSON.stringify({ invoiceId: "abc123", status: "success", reference: "42", amount: 150000 });
    const sig = sign(privateKey, body);
    const tampered = JSON.stringify({ invoiceId: "abc123", status: "success", reference: "42", amount: 999999 });

    expect(verifyWebhookSignature(tampered, sig, publicKeyBase64)).toBe(false);
  });

  it("returns false for a garbage signature", () => {
    const { publicKeyBase64 } = makeKeyPair();
    const body = JSON.stringify({ invoiceId: "abc123", status: "success" });

    expect(verifyWebhookSignature(body, "not-a-real-signature==", publicKeyBase64)).toBe(false);
  });

  it("returns false for a garbage public key and never throws", () => {
    const body = JSON.stringify({ invoiceId: "abc123", status: "success" });
    const { privateKey } = makeKeyPair();
    const sig = sign(privateKey, body);

    expect(() => verifyWebhookSignature(body, sig, "not-a-real-key-at-all")).not.toThrow();
    expect(verifyWebhookSignature(body, sig, "not-a-real-key-at-all")).toBe(false);
  });

  it("returns false when signature was produced by a different key pair", () => {
    const { publicKeyBase64 } = makeKeyPair();
    const other = makeKeyPair();
    const body = JSON.stringify({ invoiceId: "abc123", status: "success" });
    const sig = sign(other.privateKey, body);

    expect(verifyWebhookSignature(body, sig, publicKeyBase64)).toBe(false);
  });
});
