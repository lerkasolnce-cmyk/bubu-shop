"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";

const ORDER_STATUSES = ["new", "confirmed", "shipped", "done", "cancelled"] as const;

// orders.id is a bigint identity, NOT a uuid — coerce+int, never z.uuid() here.
const updateStatusSchema = z.object({
  id: z.coerce.number().int().positive(),
  status: z.enum(ORDER_STATUSES),
});

export type UpdateOrderStatusResult = {
  ok: boolean;
  error?: string;
};

/**
 * Updates an order's status. Auth is re-checked here (defense in depth on top of
 * the protected-layout guard) since Server Actions are reachable via direct POST too.
 */
export async function updateOrderStatus(id: number, status: string): Promise<UpdateOrderStatusResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const parsed = updateStatusSchema.safeParse({ id, status });
  if (!parsed.success) return { ok: false, error: "validation" };

  const { error } = await supabase
    .from("orders")
    .update({ order_status: parsed.data.status })
    .eq("id", parsed.data.id);

  if (error) {
    console.error("updateOrderStatus:", error.message);
    return { ok: false, error: "unknown" };
  }

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${parsed.data.id}`);
  return { ok: true };
}
