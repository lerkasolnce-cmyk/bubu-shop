"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";

// Empty string -> undefined before validation, same reasoning as products/actions.ts:
// a blank optional field (e.g. "root" parent) must not fail z.uuid().
const emptyToUndefined = (v: unknown) => (v === "" || v == null ? undefined : v);

const categorySchema = z.object({
  id: z.uuid().optional(),
  name_ua: z.string().trim().min(1),
  name_ru: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  parent_id: z.preprocess(emptyToUndefined, z.uuid().optional()),
  sort: z.coerce.number().int(),
});

export type SaveCategoryResult = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  id?: string;
};

export type DeleteCategoryResult = {
  ok: boolean;
  error?: string;
  count?: number;
};

/**
 * Inserts/updates a category row. Auth is re-checked here (defense in depth on top of
 * the protected-layout guard) since Server Actions are reachable via direct POST too.
 */
export async function saveCategory(formData: FormData): Promise<SaveCategoryResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = categorySchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "validation", fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }
  const v = parsed.data;

  // A category can't be its own parent — the UI already excludes self from the
  // options list, but a forged POST could still send it, so reject defensively.
  if (v.id && v.parent_id === v.id) {
    return { ok: false, error: "self_parent" };
  }

  const payload = {
    name_ua: v.name_ua,
    name_ru: v.name_ru,
    slug: v.slug,
    parent_id: v.parent_id ?? null,
    sort: v.sort,
  };

  const query = v.id
    ? supabase.from("categories").update(payload).eq("id", v.id).select("id").single()
    : supabase.from("categories").insert(payload).select("id").single();

  const { data, error } = await query;
  if (error || !data) {
    console.error("saveCategory:", error?.message);
    return { ok: false, error: error?.code === "23505" ? "slug_conflict" : "unknown" };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
  return { ok: true, id: data.id as string };
}

/**
 * Deletes a category — no cascade. Refuses when products still reference it, or when
 * it has child categories (both would otherwise be silently orphaned/reparented by the
 * FK's `on delete set null`). Auth is re-checked here for the same reason as saveCategory.
 */
export async function deleteCategory(id: string): Promise<DeleteCategoryResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  if (!z.uuid().safeParse(id).success) return { ok: false, error: "invalid_id" };

  const { count: productCount, error: productsError } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("category_id", id);
  if (productsError) {
    console.error("deleteCategory: products count failed", productsError.message);
    return { ok: false, error: "unknown" };
  }
  if ((productCount ?? 0) > 0) {
    return { ok: false, error: "has_products", count: productCount ?? 0 };
  }

  const { count: childCount, error: childrenError } = await supabase
    .from("categories")
    .select("*", { count: "exact", head: true })
    .eq("parent_id", id);
  if (childrenError) {
    console.error("deleteCategory: children count failed", childrenError.message);
    return { ok: false, error: "unknown" };
  }
  if ((childCount ?? 0) > 0) {
    return { ok: false, error: "has_children", count: childCount ?? 0 };
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) {
    console.error("deleteCategory:", error.message);
    return { ok: false, error: "unknown" };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/", "layout");
  return { ok: true };
}
