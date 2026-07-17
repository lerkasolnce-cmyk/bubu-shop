import type { Category } from "@/lib/types";
import { pick, type Locale } from "@/lib/i18n/shared";

/**
 * IT/EN names for the fixed category taxonomy, keyed by slug.
 *
 * The `categories` table only stores name_ua / name_ru (the shop's two content
 * locales), so IT/EN category labels live here in code instead of the DB. The
 * taxonomy is a fixed set defined in scripts/seed-data.ts, not editor-managed,
 * so a code map keeps IT/EN translated without a schema change or admin fields.
 * Product names, by contrast, DO carry name_it/name_en in the DB.
 */
export const CATEGORY_I18N: Record<string, { it: string; en: string }> = {
  // --- Roots ---
  strollers: { it: "Passeggini", en: "Strollers" },
  "car-seats": { it: "Seggiolini auto", en: "Car seats" },
  accessories: { it: "Accessori", en: "Accessories" },
  nursery: { it: "Cameretta", en: "Nursery" },
  highchairs: { it: "Seggioloni e sdraiette", en: "Highchairs & loungers" },
  "kids-transport": { it: "Trasporto bimbi", en: "Kids' transport" },
  feeding: { it: "Pappa e allattamento", en: "Feeding" },
  hygiene: { it: "Igiene e cura", en: "Hygiene & care" },
  toys: { it: "Giocattoli", en: "Toys" },
  clothing: { it: "Abbigliamento", en: "Baby clothing" },

  // --- Strollers ---
  "strollers-2in1": { it: "Passeggini 2 in 1", en: "2-in-1 strollers" },
  "strollers-3in1": { it: "Passeggini 3 in 1", en: "3-in-1 strollers" },
  "strollers-buggy": { it: "Passeggini leggeri", en: "Buggies" },
  "strollers-twins": { it: "Passeggini gemellari", en: "Twin strollers" },

  // --- Car seats ---
  "car-seats-0plus": { it: "Seggiolini 0+", en: "Car seats 0+" },
  "car-seats-isize": { it: "Seggiolini i-Size", en: "i-Size car seats" },
  "car-seats-boosters": { it: "Rialzi booster", en: "Boosters" },
  "car-seat-bases": { it: "Basi ISOFIX", en: "ISOFIX bases" },

  // --- Accessories ---
  "accessories-stroller": { it: "Accessori passeggino", en: "Stroller accessories" },
  footmuffs: { it: "Sacchi e coperture", en: "Footmuffs & covers" },
  "accessories-carseat": { it: "Accessori seggiolino", en: "Car-seat accessories" },

  // --- Nursery ---
  cribs: { it: "Lettini", en: "Cots" },
  mattresses: { it: "Materassi", en: "Mattresses" },
  dressers: { it: "Cassettiere e fasciatoi", en: "Dressers & changing tables" },
  bedding: { it: "Biancheria e tessili", en: "Bedding & textiles" },

  // --- Highchairs & loungers ---
  "feeding-chairs": { it: "Seggioloni pappa", en: "Highchairs" },
  loungers: { it: "Sdraiette e altalene", en: "Loungers & swings" },
  walkers: { it: "Girelli", en: "Baby walkers" },

  // --- Kids' transport ---
  bikes: { it: "Biciclette", en: "Bikes" },
  scooters: { it: "Monopattini", en: "Scooters" },
  "balance-bikes": { it: "Bici senza pedali", en: "Balance bikes" },
  "ride-on-cars": { it: "Auto elettriche", en: "Ride-on cars" },

  // --- Feeding ---
  bottles: { it: "Biberon e tettarelle", en: "Bottles & teats" },
  sterilizers: { it: "Sterilizzatori e scaldabiberon", en: "Sterilizers & warmers" },
  tableware: { it: "Stoviglie bimbi", en: "Baby tableware" },
  "breast-pumps": { it: "Tiralatte", en: "Breast pumps" },

  // --- Hygiene & care ---
  baths: { it: "Vaschette", en: "Baby baths" },
  "baby-cosmetics": { it: "Cosmetici bimbi", en: "Baby cosmetics" },
  potties: { it: "Vasini", en: "Potties" },

  // --- Toys ---
  "toys-baby": { it: "Per i più piccoli", en: "For the littlest" },
  "toys-educational": { it: "Giochi educativi", en: "Educational toys" },
  "toys-soft": { it: "Peluche", en: "Soft toys" },

  // --- Clothing ---
  "clothes-newborn": { it: "Per neonati", en: "For newborns" },
  bodysuits: { it: "Body e tutine", en: "Bodysuits & rompers" },
  outerwear: { it: "Capispalla", en: "Outerwear" },
};

/**
 * Localized category name. ua/ru come from the DB row; it/en come from the code
 * map above (falling back to the row's DB value, then to the ua/ru pick fallback)
 * so a category missing from the map never renders blank.
 */
export function categoryName(cat: Pick<Category, "slug" | "name_ua" | "name_ru" | "name_it" | "name_en">, locale: Locale): string {
  if (locale === "it" || locale === "en") {
    const mapped = CATEGORY_I18N[cat.slug]?.[locale];
    if (mapped) return mapped;
  }
  return pick(cat, "name", locale);
}
