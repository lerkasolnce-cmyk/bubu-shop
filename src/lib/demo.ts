// Демо-данные для предпросмотра, пока Supabase не подключён (нет env-ключей).
// Используются ТОЛЬКО как fallback при отсутствии NEXT_PUBLIC_SUPABASE_URL.
import { categories as seedCategories, products as seedProducts } from "../../scripts/seed-data";
import type { Category, Product } from "@/lib/types";

const DEMO_CREATED_AT = "2026-01-01T00:00:00.000Z";

export const demoCategories: Category[] = seedCategories.map((c) => ({
  id: `demo-${c.slug}`,
  slug: c.slug,
  name_ua: c.name_ua,
  name_ru: c.name_ru,
  parent_id: null,
  sort: c.sort,
}));

export const demoProducts: Product[] = seedProducts.map((p) => ({
  id: `demo-${p.slug}`,
  slug: p.slug,
  name_ua: p.name_ua,
  name_ru: p.name_ru,
  description_ua: p.description_ua,
  description_ru: p.description_ru,
  brand: p.brand,
  category_id: `demo-${p.category_slug}`,
  price: p.price,
  old_price: p.old_price,
  stock_status: p.stock_status,
  specs: p.specs,
  images: p.images,
  is_hit: p.is_hit,
  is_sale: p.is_sale,
  created_at: DEMO_CREATED_AT,
}));

export const isDemoMode = () => !process.env.NEXT_PUBLIC_SUPABASE_URL;
