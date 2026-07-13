import { getLocale, getT, pick } from "@/lib/i18n";
import { getEurRate } from "@/lib/currency";
import { createServerClient } from "@/lib/supabase/server";
import { demoCategories, demoProducts, isDemoMode } from "@/lib/demo";
import type { Category, Product } from "@/lib/types";
import NatureHero from "@/components/NatureHero";
import CategoryGrid from "@/components/CategoryGrid";
import ProductRow from "@/components/ProductRow";
import BrandStrip from "@/components/BrandStrip";
import Advantages from "@/components/Advantages";
import Reveal from "@/components/Reveal";

async function getHitProducts(): Promise<Product[]> {
  // Supabase project may not exist yet (no env) — demo data for design preview.
  if (isDemoMode()) return demoProducts.filter((p) => p.is_hit).slice(0, 8);

  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_hit", true)
      .limit(8);

    if (error || !data) return [];
    return data as Product[];
  } catch {
    return [];
  }
}

async function getSaleProducts(): Promise<Product[]> {
  if (isDemoMode()) return demoProducts.filter((p) => p.is_sale).slice(0, 8);

  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("is_sale", true)
      .limit(8);

    if (error || !data) return [];
    return data as Product[];
  } catch {
    return [];
  }
}

async function getCategoriesWithCounts(): Promise<(Category & { count: number })[]> {
  if (isDemoMode()) {
    const roots = demoCategories.filter((c) => c.parent_id === null);
    return roots.map((cat) => {
      const childIds = demoCategories.filter((c) => c.parent_id === cat.id).map((c) => c.id);
      const ids = new Set([cat.id, ...childIds]);
      return { ...cat, count: demoProducts.filter((p) => p.category_id != null && ids.has(p.category_id)).length };
    });
  }

  try {
    const supabase = await createServerClient();
    const { data: allCategories, error } = await supabase
      .from("categories")
      .select("*")
      .order("sort", { ascending: true });

    if (error || !allCategories) return [];

    const roots = allCategories.filter((c) => c.parent_id === null);

    // N=3 root categories — per-category count queries (root + its children) are
    // simple and fine here.
    const counts = await Promise.all(
      roots.map(async (cat) => {
        const childIds = allCategories.filter((c) => c.parent_id === cat.id).map((c) => c.id);
        const { count } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .in("category_id", [cat.id, ...childIds]);
        return count ?? 0;
      })
    );

    return roots.map((cat, i) => ({ ...cat, count: counts[i] })) as (Category & { count: number })[];
  } catch {
    return [];
  }
}

export default async function Home() {
  const locale = await getLocale();
  const t = getT(locale);

  const [hits, sale, categories, rate] = await Promise.all([
    getHitProducts(),
    getSaleProducts(),
    getCategoriesWithCounts(),
    locale === "it" ? getEurRate() : Promise.resolve(null),
  ]);

  const categoryCards = categories.map((cat) => ({
    slug: cat.slug,
    name: pick(cat, "name", locale),
    count: cat.count,
  }));

  return (
    <div className="flex flex-col gap-12 pb-12">
      {/* The category cards live INSIDE the hero: they drop in during the petal
          transition and stand on the risen wave at the pin's end. */}
      <NatureHero title={t("hero.title")} subtitle={t("hero.subtitle")} cta={t("hero.cta")}>
        <CategoryGrid categories={categoryCards} t={t} variant="plain" />
      </NatureHero>
      <Reveal delay={80}>
        <ProductRow title={t("home.hits")} products={hits} locale={locale} t={t} rate={rate} />
      </Reveal>
      <Reveal delay={80}>
        <ProductRow title={t("home.sale")} products={sale} locale={locale} t={t} rate={rate} />
      </Reveal>
      <Reveal delay={120}>
        <BrandStrip />
      </Reveal>
      <Reveal delay={160}>
        <Advantages t={t} />
      </Reveal>
    </div>
  );
}
