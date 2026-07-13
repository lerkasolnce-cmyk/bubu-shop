import type { StockStatus } from "../src/lib/types";
import { anexProducts } from "./seed-data-anex";
import { cybexProducts } from "./seed-data-cybex";
import { espiroProducts } from "./seed-data-espiro";

export interface CategorySeed {
  slug: string;
  name_ua: string;
  name_ru: string;
  sort: number;
  /** Slug of the parent category, if this is a child (2-level tree, root when omitted). */
  parent_slug?: string;
}

export interface ProductSeed {
  slug: string;
  name_ua: string;
  name_ru: string;
  description_ua: string;
  description_ru: string;
  brand: string;
  category_slug: string;
  price: number;
  old_price: number | null;
  stock_status: StockStatus;
  specs: Record<string, string>;
  images: string[];
  is_hit: boolean;
  is_sale: boolean;
}

export const categories: CategorySeed[] = [
  // --- Roots ---
  { slug: "strollers", name_ua: "Коляски", name_ru: "Коляски", sort: 1 },
  { slug: "car-seats", name_ua: "Автокрісла", name_ru: "Автокресла", sort: 2 },
  { slug: "accessories", name_ua: "Аксесуари", name_ru: "Аксессуары", sort: 3 },

  // --- Children of strollers ---
  { slug: "strollers-2in1", name_ua: "Коляски 2 в 1", name_ru: "Коляски 2 в 1", sort: 1, parent_slug: "strollers" },
  { slug: "strollers-3in1", name_ua: "Коляски 3 в 1", name_ru: "Коляски 3 в 1", sort: 2, parent_slug: "strollers" },
  { slug: "strollers-buggy", name_ua: "Прогулянкові коляски", name_ru: "Прогулочные коляски", sort: 3, parent_slug: "strollers" },
  { slug: "strollers-twins", name_ua: "Коляски для двійні", name_ru: "Коляски для двойни", sort: 4, parent_slug: "strollers" },

  // --- Children of car-seats ---
  { slug: "car-seats-0plus", name_ua: "Автокрісла 0+", name_ru: "Автокресла 0+", sort: 1, parent_slug: "car-seats" },
  { slug: "car-seats-isize", name_ua: "Автокрісла i-Size", name_ru: "Автокресла i-Size", sort: 2, parent_slug: "car-seats" },
  { slug: "car-seats-boosters", name_ua: "Бустери", name_ru: "Бустеры", sort: 3, parent_slug: "car-seats" },
  { slug: "car-seat-bases", name_ua: "Бази ISOFIX", name_ru: "Базы ISOFIX", sort: 4, parent_slug: "car-seats" },

  // --- Children of accessories ---
  { slug: "accessories-stroller", name_ua: "Аксесуари для колясок", name_ru: "Аксессуары для колясок", sort: 1, parent_slug: "accessories" },
  { slug: "footmuffs", name_ua: "Конверти та чохли", name_ru: "Конверты и чехлы", sort: 2, parent_slug: "accessories" },
  { slug: "accessories-carseat", name_ua: "Аксесуари для автокрісел", name_ru: "Аксессуары для автокресел", sort: 3, parent_slug: "accessories" },
];

// Product catalog is split by brand (scripts/seed-data-anex.ts, seed-data-cybex.ts,
// seed-data-espiro.ts) to keep files manageable; combined here for seed.ts / demo.ts.
export const products: ProductSeed[] = [...anexProducts, ...cybexProducts, ...espiroProducts];
