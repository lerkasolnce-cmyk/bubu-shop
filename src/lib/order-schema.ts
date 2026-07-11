import { z } from "zod";

// Shared between the client (CheckoutForm, pre-submit validation) and the
// server (POST /api/orders, source of truth) so the two never drift apart.
// No server-only imports here — this file must stay safe to import from a
// "use client" component.
export const orderSchema = z.object({
  customer: z.object({
    name: z.string().min(1),
    phone: z.string().regex(/^\+380\d{9}$/),
    city: z.string().min(1),
    npOffice: z.string().optional().default(""),
    comment: z.string().optional().default(""),
  }),
  items: z
    .array(
      z.object({
        slug: z.string().min(1),
        qty: z.int().min(1).max(99),
      })
    )
    .min(1)
    .max(50),
  paymentMethod: z.enum(["mono", "cod"]),
  // Shopper's locale at checkout time — only 'it' triggers an EUR rate
  // snapshot on the order; monopay/UAH accounting is unaffected either way.
  locale: z.enum(["ua", "ru", "it", "en"]).optional().default("ua"),
});

export type OrderInput = z.infer<typeof orderSchema>;
