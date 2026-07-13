/**
 * Standalone seed script. Run with: npx tsx scripts/seed.ts
 *
 * Does NOT import the Next.js server-only supabase client — it talks to
 * Supabase directly via @supabase/supabase-js using the service role key,
 * so it can run outside the Next.js runtime.
 *
 * tsx does not autoload .env files, so we read .env.local ourselves and
 * populate process.env before creating the client.
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";
import { categories, products } from "./seed-data";

function loadEnvLocal(): void {
  const envPath = resolve(process.cwd(), ".env.local");
  if (!existsSync(envPath)) return;

  const contents = readFileSync(envPath, "utf-8");
  for (const rawLine of contents.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eq = line.indexOf("=");
    if (eq === -1) continue;

    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

async function main() {
  loadEnvLocal();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    console.error(
      "Помилка: не знайдено NEXT_PUBLIC_SUPABASE_URL та/або SUPABASE_SERVICE_ROLE_KEY.\n" +
        "Створіть .env.local (див. README.md, розділ «Налаштування Supabase») і повторіть спробу."
    );
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // Two-level tree: roots first (parent_id null), then children with parent_id resolved
  // by parent_slug lookup against the just-upserted roots — a category must exist before
  // it can be referenced as a parent.
  const roots = categories.filter((c) => !c.parent_slug);
  const children = categories.filter((c) => c.parent_slug);

  const rootRows = roots.map(({ parent_slug: _parent_slug, ...rest }) => ({ ...rest, parent_id: null }));

  const { data: upsertedRoots, error: rootsError } = await supabase
    .from("categories")
    .upsert(rootRows, { onConflict: "slug" })
    .select("id, slug");

  if (rootsError) {
    console.error("Помилка запису кореневих категорій:", rootsError.message);
    process.exit(1);
  }

  const categoryIdBySlug = new Map<string, string>(
    (upsertedRoots ?? []).map((c) => [c.slug, c.id])
  );

  const childRows = children.map(({ parent_slug, ...rest }) => {
    const parent_id = parent_slug ? categoryIdBySlug.get(parent_slug) ?? null : null;
    if (parent_slug && !parent_id) {
      console.warn(`Попередження: батьківську категорію "${parent_slug}" не знайдено для "${rest.slug}"`);
    }
    return { ...rest, parent_id };
  });

  const { data: upsertedChildren, error: childrenError } = await supabase
    .from("categories")
    .upsert(childRows, { onConflict: "slug" })
    .select("id, slug");

  if (childrenError) {
    console.error("Помилка запису дочірніх категорій:", childrenError.message);
    process.exit(1);
  }

  for (const c of upsertedChildren ?? []) {
    categoryIdBySlug.set(c.slug, c.id);
  }

  const productRows = products.map(({ category_slug, ...rest }) => {
    const category_id = categoryIdBySlug.get(category_slug) ?? null;
    if (!category_id) {
      console.warn(`Попередження: категорію "${category_slug}" не знайдено для товару "${rest.slug}"`);
    }
    return { ...rest, category_id };
  });

  const { error: productsError } = await supabase
    .from("products")
    .upsert(productRows, { onConflict: "slug" });

  if (productsError) {
    console.error("Помилка запису товарів:", productsError.message);
    process.exit(1);
  }

  console.log(`seeded ${categories.length} categories, ${products.length} products`);
}

main().catch((err) => {
  console.error("Неочікувана помилка seed-скрипта:", err);
  process.exit(1);
});
