"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";

const STOCK_STATUSES = ["in_stock", "preorder", "out_of_stock"] as const;

// Empty string -> undefined before coercion, otherwise z.coerce.number() turns "" into 0
// (Number("") === 0) instead of failing validation on a blank required/optional field.
const emptyToUndefined = (v: unknown) => (v === "" || v == null ? undefined : v);

const productSchema = z.object({
  id: z.string().trim().optional(),
  name_ua: z.string().trim().min(1),
  name_ru: z.string().trim().min(1),
  slug: z.string().trim().optional(),
  brand: z.string().trim().min(1),
  category_id: z.string().trim().optional(),
  price: z.preprocess(emptyToUndefined, z.coerce.number().int().min(0)),
  old_price: z.preprocess(emptyToUndefined, z.coerce.number().int().min(0).optional()),
  stock_status: z.enum(STOCK_STATUSES),
  description_ua: z.string().optional().default(""),
  description_ru: z.string().optional().default(""),
  is_hit: z.string().optional(),
  is_sale: z.string().optional(),
  specs: z.string().optional().default("{}"),
  images: z.string().optional().default("[]"),
});

export type SaveProductResult = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
  id?: string;
};

export type DeleteProductResult = {
  ok: boolean;
  error?: string;
};

// Simplified Ukrainian -> Latin transliteration for slug generation. Deliberately
// ASCII-only: any character left unmapped (Russian-only letters, punctuation, emoji)
// falls through to the cleanup regex below and becomes a hyphen, so the result is
// always a safe URL slug even for input we didn't anticipate.
const UA_TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie", ж: "zh", з: "z",
  и: "y", і: "i", ї: "i", й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p",
  р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch",
  ю: "iu", я: "ia", ь: "", "'": "", "’": "",
};

function transliterate(input: string): string {
  const lower = input.toLowerCase();
  let out = "";
  for (const ch of lower) {
    out += UA_TRANSLIT[ch] ?? ch;
  }
  return out
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Inserts/updates a product row. Auth is re-checked here (defense in depth on top of
 * the protected-layout guard) since Server Actions are reachable via direct POST too.
 */
export async function saveProduct(formData: FormData): Promise<SaveProductResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const raw = Object.fromEntries(formData.entries());
  const parsed = productSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "validation", fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }
  const v = parsed.data;

  let specs: Record<string, string>;
  try {
    specs = JSON.parse(v.specs);
  } catch {
    return { ok: false, error: "invalid specs" };
  }

  let images: string[];
  try {
    images = JSON.parse(v.images);
  } catch {
    return { ok: false, error: "invalid images" };
  }

  const baseSlug = v.slug && v.slug.length > 0 ? transliterate(v.slug) : transliterate(v.name_ua);
  const slugCandidate = baseSlug || "product";

  const payload = {
    name_ua: v.name_ua,
    name_ru: v.name_ru,
    brand: v.brand,
    category_id: v.category_id ? v.category_id : null,
    price: v.price,
    old_price: v.old_price ?? null,
    stock_status: v.stock_status,
    description_ua: v.description_ua,
    description_ru: v.description_ru,
    is_hit: v.is_hit === "on",
    is_sale: v.is_sale === "on",
    specs,
    images,
  };

  const MAX_ATTEMPTS = 5;
  let slug = slugCandidate;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const row = { ...payload, slug };

    const query = v.id
      ? supabase.from("products").update(row).eq("id", v.id).select("id").single()
      : supabase.from("products").insert(row).select("id").single();

    const { data, error } = await query;

    if (!error && data) {
      revalidatePath("/admin/products");
      revalidatePath("/", "layout");
      return { ok: true, id: data.id as string };
    }

    if (error?.code === "23505") {
      slug = `${slugCandidate}-${attempt + 2}`;
      continue;
    }

    return { ok: false, error: error?.message ?? "unknown error" };
  }

  return { ok: false, error: "slug conflict" };
}

/**
 * Deletes a product row and best-effort removes its Storage files (products/<slug>/*).
 * Auth is re-checked here for the same reason as saveProduct.
 */
export async function deleteProduct(id: string): Promise<DeleteProductResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  const { data: product } = await supabase.from("products").select("slug").eq("id", id).maybeSingle();

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  if (product?.slug) {
    try {
      const { data: files } = await supabase.storage.from("products").list(product.slug);
      if (files && files.length > 0) {
        await supabase.storage.from("products").remove(files.map((f) => `${product.slug}/${f.name}`));
      }
    } catch {
      // Storage cleanup is best-effort — the row is already gone either way.
    }
  }

  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
  return { ok: true };
}
