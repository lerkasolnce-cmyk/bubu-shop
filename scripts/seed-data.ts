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
  /** IT/EN names are derived from name_ua (see localizeName) so all 4 locales show a
   *  translated product name instead of falling back to Ukrainian. */
  name_it?: string;
  name_en?: string;
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

  // --- Roots (new — full store taxonomy, filled via CSV import later) ---
  { slug: "nursery", name_ua: "Дитяча кімната", name_ru: "Детская комната", sort: 4 },
  { slug: "highchairs", name_ua: "Стільці та шезлонги", name_ru: "Стульчики и шезлонги", sort: 5 },
  { slug: "kids-transport", name_ua: "Дитячий транспорт", name_ru: "Детский транспорт", sort: 6 },
  { slug: "feeding", name_ua: "Все для годування", name_ru: "Всё для кормления", sort: 7 },
  { slug: "hygiene", name_ua: "Гігієна та догляд", name_ru: "Гигиена и уход", sort: 8 },
  { slug: "toys", name_ua: "Іграшки", name_ru: "Игрушки", sort: 9 },
  { slug: "clothing", name_ua: "Дитячий одяг", name_ru: "Детская одежда", sort: 10 },

  // --- Children of nursery ---
  { slug: "cribs", name_ua: "Ліжечка", name_ru: "Кроватки", sort: 1, parent_slug: "nursery" },
  { slug: "mattresses", name_ua: "Матраци", name_ru: "Матрасы", sort: 2, parent_slug: "nursery" },
  { slug: "dressers", name_ua: "Комоди та пеленатори", name_ru: "Комоды и пеленаторы", sort: 3, parent_slug: "nursery" },
  { slug: "bedding", name_ua: "Постіль і текстиль", name_ru: "Постель и текстиль", sort: 4, parent_slug: "nursery" },

  // --- Children of highchairs ---
  { slug: "feeding-chairs", name_ua: "Стільці для годування", name_ru: "Стульчики для кормления", sort: 1, parent_slug: "highchairs" },
  { slug: "loungers", name_ua: "Шезлонги та гойдалки", name_ru: "Шезлонги и качели", sort: 2, parent_slug: "highchairs" },
  { slug: "walkers", name_ua: "Ходунки", name_ru: "Ходунки", sort: 3, parent_slug: "highchairs" },

  // --- Children of kids-transport ---
  { slug: "bikes", name_ua: "Велосипеди", name_ru: "Велосипеды", sort: 1, parent_slug: "kids-transport" },
  { slug: "scooters", name_ua: "Самокати", name_ru: "Самокаты", sort: 2, parent_slug: "kids-transport" },
  { slug: "balance-bikes", name_ua: "Біговели", name_ru: "Беговелы", sort: 3, parent_slug: "kids-transport" },
  { slug: "ride-on-cars", name_ua: "Електромобілі", name_ru: "Электромобили", sort: 4, parent_slug: "kids-transport" },

  // --- Children of feeding ---
  { slug: "bottles", name_ua: "Пляшечки та соски", name_ru: "Бутылочки и соски", sort: 1, parent_slug: "feeding" },
  { slug: "sterilizers", name_ua: "Стерилізатори й підігрівачі", name_ru: "Стерилизаторы и подогреватели", sort: 2, parent_slug: "feeding" },
  { slug: "tableware", name_ua: "Дитячий посуд", name_ru: "Детская посуда", sort: 3, parent_slug: "feeding" },
  { slug: "breast-pumps", name_ua: "Молоковідсмоктувачі", name_ru: "Молокоотсосы", sort: 4, parent_slug: "feeding" },

  // --- Children of hygiene ---
  { slug: "baths", name_ua: "Ванночки", name_ru: "Ванночки", sort: 1, parent_slug: "hygiene" },
  { slug: "baby-cosmetics", name_ua: "Дитяча косметика", name_ru: "Детская косметика", sort: 2, parent_slug: "hygiene" },
  { slug: "potties", name_ua: "Горщики", name_ru: "Горшки", sort: 3, parent_slug: "hygiene" },

  // --- Children of toys ---
  { slug: "toys-baby", name_ua: "Для найменших", name_ru: "Для самых маленьких", sort: 1, parent_slug: "toys" },
  { slug: "toys-educational", name_ua: "Розвиваючі", name_ru: "Развивающие", sort: 2, parent_slug: "toys" },
  { slug: "toys-soft", name_ua: "М'які іграшки", name_ru: "Мягкие игрушки", sort: 3, parent_slug: "toys" },

  // --- Children of clothing ---
  { slug: "clothes-newborn", name_ua: "Для новонароджених", name_ru: "Для новорожденных", sort: 1, parent_slug: "clothing" },
  { slug: "bodysuits", name_ua: "Боді та чоловічки", name_ru: "Боди и человечки", sort: 2, parent_slug: "clothing" },
  { slug: "outerwear", name_ua: "Верхній одяг", name_ru: "Верхняя одежда", sort: 3, parent_slug: "clothing" },
];

// --- Localized product names -------------------------------------------------
// Product names are formulaic: "<noun> <Brand Model> [N в N] (<colour>)". Brand,
// model and colour are language-neutral (Latin script), so localizing a name only
// means translating the leading noun phrase and the "N в N" configuration token.
// This fills name_it / name_en for every product so IT/EN shoppers see a translated
// name rather than the Ukrainian fallback.
const NOUN_TRANSLATIONS: Record<string, { en: string; it: string }> = {
  "Коляска": { en: "Stroller", it: "Passeggino" },
  "Коляска для двійні": { en: "Twin stroller", it: "Passeggino gemellare" },
  "Автокрісло": { en: "Car seat", it: "Seggiolino auto" },
  "Автокрісло-бустер": { en: "Booster car seat", it: "Seggiolino auto booster" },
  "База ISOFIX": { en: "ISOFIX base", it: "Base ISOFIX" },
  "Адаптер універсальний для автокрісла": {
    en: "Universal car-seat adapter",
    it: "Adattatore universale per seggiolino",
  },
  "Сумка для мами": { en: "Changing bag", it: "Borsa fasciatoio" },
  "Дорожня сумка для коляски": { en: "Stroller travel bag", it: "Borsa da viaggio per passeggino" },
  "Гачок для сумок на коляску": { en: "Stroller bag hook", it: "Gancio per borse da passeggino" },
  "Дощовик універсальний": { en: "Universal rain cover", it: "Parapioggia universale" },
  "Дощовик для колясок": { en: "Stroller rain cover", it: "Parapioggia per passeggino" },
  "Москітна сітка універсальна": { en: "Universal mosquito net", it: "Zanzariera universale" },
  "Москітна сітка": { en: "Mosquito net", it: "Zanzariera" },
  "Підстаканник універсальний": { en: "Universal cup holder", it: "Portabicchiere universale" },
  "Підстаканник": { en: "Cup holder", it: "Portabicchiere" },
  "Сонцезахисний козирок": { en: "Sun canopy", it: "Parasole" },
  "Органайзер на ручку коляски": { en: "Stroller handlebar organizer", it: "Organizer per manico del passeggino" },
  "Органайзер на коляску": { en: "Stroller organizer", it: "Organizer per passeggino" },
  "Приставна платформа для старшої дитини": {
    en: "Ride-on board for an older child",
    it: "Pedana per il bambino più grande",
  },
  "Вкладиш для новонародженого": { en: "Newborn insert", it: "Riduttore per neonato" },
  "Вкладиш у прогулянковий блок універсальний": {
    en: "Universal seat-unit insert",
    it: "Riduttore universale per seduta",
  },
  "Конверт фірмовий для коляски": { en: "Branded stroller footmuff", it: "Sacco coprigambe per passeggino" },
  "Конверт зимовий для коляски": { en: "Winter stroller footmuff", it: "Sacco invernale per passeggino" },
  "Конверт демісезонний для коляски": {
    en: "All-season stroller footmuff",
    it: "Sacco coprigambe multistagione per passeggino",
  },
  "Конверт зимовий": { en: "Winter footmuff", it: "Sacco invernale coprigambe" },
};

const BRAND_RE = /\b(Anex|Cybex|Espiro|Bubu)\b/;

/** Localize a Ukrainian product name to en/it (see NOUN_TRANSLATIONS). Unknown noun
 *  phrases fall through unchanged — the caller still gets a usable string. */
export function localizeName(nameUa: string, locale: "en" | "it"): string {
  // "N в N" configuration token → "N in N" (identical for en and it).
  const s = nameUa.replace(/(\d+)\s+в\s+(\d+)/g, "$1 in $2");

  // Split off the leading noun phrase: everything before the brand token, or (for
  // brandless accessories) everything before the trailing "(...)" colour group.
  const brand = s.match(BRAND_RE);
  let noun: string;
  let tail: string;
  if (brand && brand.index !== undefined) {
    noun = s.slice(0, brand.index).trim();
    tail = s.slice(brand.index).trim();
  } else {
    const paren = s.match(/\s*\([^)]*\)\s*$/);
    if (paren && paren.index !== undefined) {
      noun = s.slice(0, paren.index).trim();
      tail = paren[0].trim();
    } else {
      noun = s.trim();
      tail = "";
    }
  }

  const translated = NOUN_TRANSLATIONS[noun]?.[locale] ?? noun;
  return [translated, tail].filter(Boolean).join(" ");
}

// Product catalog is split by brand (scripts/seed-data-anex.ts, seed-data-cybex.ts,
// seed-data-espiro.ts) to keep files manageable; combined here for seed.ts / demo.ts.
// name_it / name_en are derived from name_ua so all four locales show a real name.
export const products: ProductSeed[] = [...anexProducts, ...cybexProducts, ...espiroProducts].map((p) => ({
  ...p,
  name_en: localizeName(p.name_ua, "en"),
  name_it: localizeName(p.name_ua, "it"),
}));
