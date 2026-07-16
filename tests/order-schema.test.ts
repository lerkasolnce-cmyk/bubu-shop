import { describe, expect, it } from "vitest";
import { orderSchema } from "@/lib/order-schema";

const base = {
  customer: { name: "Тест", city: "Одеса", npOffice: "", comment: "" },
  items: [{ slug: "anex-flo-charm", qty: 1 }],
  paymentMethod: "cod" as const,
};

function withPhone(phone: string) {
  return { ...base, customer: { ...base.customer, phone } };
}

describe("orderSchema phone", () => {
  it("accepts UA numbers (+380 + 9 digits)", () => {
    expect(orderSchema.safeParse(withPhone("+380631284609")).success).toBe(true);
  });

  it("accepts Italian mobiles and landlines (+39 + 8-11 digits)", () => {
    expect(orderSchema.safeParse(withPhone("+393444228840")).success).toBe(true); // mobile
    expect(orderSchema.safeParse(withPhone("+39064821111")).success).toBe(true); // Rome landline w/ leading 0
  });

  it("rejects wrong lengths and other prefixes", () => {
    expect(orderSchema.safeParse(withPhone("+38063128460")).success).toBe(false); // 8 digits
    expect(orderSchema.safeParse(withPhone("+3806312846099")).success).toBe(false); // 10 digits
    expect(orderSchema.safeParse(withPhone("+391234567")).success).toBe(false); // 7 digits
    expect(orderSchema.safeParse(withPhone("+491701234567")).success).toBe(false); // DE
    expect(orderSchema.safeParse(withPhone("380631284609")).success).toBe(false); // no +
  });
});
