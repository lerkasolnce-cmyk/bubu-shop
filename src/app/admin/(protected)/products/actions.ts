"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";

const STOCK_STATUSES = ["in_stock", "preorder", "out_of_stock"] as const;

// Empty string -> undefined before coercion, otherwise z.coerce.number() turns "" into 0
// (Number("") === 0) instead of failing validation on a blank required/optional field.
const emptyToUndefined = (v: unknown) => (v === "" || v == null ? undefined : v);

// Shape of the hidden-input JSON payloads after JSON.parse — forged FormData could
// otherwise smuggle non-string arrays/objects into jsonb/text[] columns (a non-string
// in images[] would later crash the list page inside next/image).
const specsShape = z.record(z.string(), z.string());
const imagesShape = z.array(z.string());

const productSchema = z.object({
  id: z.uuid().optional(),
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

  let specsRaw: unknown;
  try {
    specsRaw = JSON.parse(v.specs);
  } catch {
    return { ok: false, error: "validation", fieldErrors: { specs: ["invalid JSON"] } };
  }
  const specsParsed = specsShape.safeParse(specsRaw);
  if (!specsParsed.success) {
    return { ok: false, error: "validation", fieldErrors: { specs: ["invalid shape"] } };
  }
  const specs = specsParsed.data;

  let imagesRaw: unknown;
  try {
    imagesRaw = JSON.parse(v.images);
  } catch {
    return { ok: false, error: "validation", fieldErrors: { images: ["invalid JSON"] } };
  }
  const imagesParsed = imagesShape.safeParse(imagesRaw);
  if (!imagesParsed.success) {
    return { ok: false, error: "validation", fieldErrors: { images: ["invalid shape"] } };
  }
  const images = imagesParsed.data;

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

/** Recovers a storage object path from a Supabase public URL; null for foreign/unparseable URLs. */
function storagePathFromPublicUrl(publicUrl: string): string | null {
  const marker = "/object/public/products/";
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  try {
    const path = decodeURIComponent(publicUrl.slice(idx + marker.length).split("?")[0]);
    return path || null;
  } catch {
    return null;
  }
}

/**
 * Deletes a product row and best-effort removes its Storage files: first the exact
 * paths derived from images[] URLs (covers uploads outside the slug/ prefix — e.g.
 * new-product photos land in misc/ because the slug doesn't exist at upload time),
 * then a sweep of the products/<slug>/ prefix as a secondary net.
 * Auth is re-checked here for the same reason as saveProduct.
 */
export async function deleteProduct(id: string): Promise<DeleteProductResult> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "unauthorized" };

  if (!z.uuid().safeParse(id).success) return { ok: false, error: "invalid id" };

  const { data: product } = await supabase
    .from("products")
    .select("slug, images")
    .eq("id", id)
    .maybeSingle<{ slug: string; images: string[] | null }>();

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  try {
    const exactPaths = (product?.images ?? [])
      .filter((url): url is string => typeof url === "string")
      .map(storagePathFromPublicUrl)
      .filter((p): p is string => p !== null);
    if (exactPaths.length > 0) {
      await supabase.storage.from("products").remove(exactPaths);
    }

    if (product?.slug) {
      const { data: files } = await supabase.storage.from("products").list(product.slug);
      if (files && files.length > 0) {
        await supabase.storage.from("products").remove(files.map((f) => `${product.slug}/${f.name}`));
      }
    }
  } catch {
    // Storage cleanup is best-effort — the row is already gone either way.
  }

  revalidatePath("/admin/products");
  revalidatePath("/", "layout");
  return { ok: true };
}
