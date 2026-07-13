import type { StockStatus } from "../src/lib/types";

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

function strollerSpecs(
  weight: string,
  ageGroup: string,
  fold: string,
  wheels: string
): Record<string, string> {
  return {
    вага: weight,
    "група/вік": ageGroup,
    складання: fold,
    колеса: wheels,
    гарантія: "24 місяці",
  };
}

function carSeatSpecs(
  weight: string,
  group: string,
  mount: string,
  heightRange: string
): Record<string, string> {
  return {
    вага: weight,
    група: group,
    кріплення: mount,
    "зріст дитини": heightRange,
    гарантія: "24 місяці",
  };
}

function accessorySpecs(
  material: string,
  compatibility: string,
  care: string
): Record<string, string> {
  return {
    матеріал: material,
    сумісність: compatibility,
    догляд: care,
    гарантія: "12 місяців",
  };
}

export const products: ProductSeed[] = [
  // --- Anex e/type (2в1) ---
  {
    slug: "anex-etype-2in1-onyx-black",
    name_ua: "Коляска Anex e/type 2 в 1 (Onyx Black)",
    name_ru: "Коляска Anex e/type 2 в 1 (Onyx Black)",
    description_ua:
      "Компактна колиска-трансформер Anex e/type поєднує зручну люльку для новонародженого та прогулянковий блок в одному шасі. Алюмінієва рама, підвіска на всіх колесах та великий кошик роблять щоденні прогулянки комфортними містом і без асфальту.",
    description_ru:
      "Компактная коляска-трансформер Anex e/type сочетает удобную люльку для новорождённого и прогулочный блок в одном шасси. Алюминиевая рама, подвеска на всех колёсах и вместительная корзина делают ежедневные прогулки комфортными в городе и по бездорожью.",
    brand: "Anex",
    category_slug: "strollers-2in1",
    price: 39000,
    old_price: null,
    stock_status: "in_stock",
    specs: strollerSpecs("11.5 кг", "0–3 роки", "книжка одним рухом", "надувні"),
    images: [],
    is_hit: true,
    is_sale: false,
  },
  {
    slug: "anex-etype-2in1-mint",
    name_ua: "Коляска Anex e/type 2 в 1 (Mint)",
    name_ru: "Коляска Anex e/type 2 в 1 (Mint)",
    description_ua:
      "Компактна колиска-трансформер Anex e/type поєднує зручну люльку для новонародженого та прогулянковий блок в одному шасі. Алюмінієва рама, підвіска на всіх колесах та великий кошик роблять щоденні прогулянки комфортними містом і без асфальту.",
    description_ru:
      "Компактная коляска-трансформер Anex e/type сочетает удобную люльку для новорождённого и прогулочный блок в одном шасси. Алюминиевая рама, подвеска на всех колёсах и вместительная корзина делают ежедневные прогулки комфортными в городе и по бездорожью.",
    brand: "Anex",
    category_slug: "strollers-2in1",
    price: 34000,
    old_price: 39000,
    stock_status: "in_stock",
    specs: strollerSpecs("11.5 кг", "0–3 роки", "книжка одним рухом", "надувні"),
    images: [],
    is_hit: false,
    is_sale: true,
  },
  {
    slug: "anex-etype-2in1-sand-beige",
    name_ua: "Коляска Anex e/type 2 в 1 (Sand Beige)",
    name_ru: "Коляска Anex e/type 2 в 1 (Sand Beige)",
    description_ua:
      "Компактна колиска-трансформер Anex e/type поєднує зручну люльку для новонародженого та прогулянковий блок в одному шасі. Алюмінієва рама, підвіска на всіх колесах та великий кошик роблять щоденні прогулянки комфортними містом і без асфальту.",
    description_ru:
      "Компактная коляска-трансформер Anex e/type сочетает удобную люльку для новорождённого и прогулочный блок в одном шасси. Алюминиевая рама, подвеска на всех колёсах и вместительная корзина делают ежедневные прогулки комфортными в городе и по бездорожью.",
    brand: "Anex",
    category_slug: "strollers-2in1",
    price: 39000,
    old_price: null,
    stock_status: "in_stock",
    specs: strollerSpecs("11.5 кг", "0–3 роки", "книжка одним рухом", "надувні"),
    images: [],
    is_hit: false,
    is_sale: false,
  },
  // --- Anex m/type (2в1 та 3в1) ---
  {
    slug: "anex-mtype-2in1-grafit",
    name_ua: "Коляска Anex m/type 2 в 1 (Grafit)",
    name_ru: "Коляска Anex m/type 2 в 1 (Grafit)",
    description_ua:
      "Anex m/type — модульна коляска преміум-сегмента з посиленою рамою та плавним ходом на великих колесах. Глибока люлька з вентиляцією та прогулянковий блок з регульованим нахилом спинки підійдуть як для новонародженого, так і для активнішої дитини.",
    description_ru:
      "Anex m/type — модульная коляска премиум-сегмента с усиленной рамой и плавным ходом на больших колёсах. Глубокая люлька с вентиляцией и прогулочный блок с регулируемым наклоном спинки подойдут как новорождённому, так и подросшему малышу.",
    brand: "Anex",
    category_slug: "strollers-2in1",
    price: 47000,
    old_price: null,
    stock_status: "in_stock",
    specs: strollerSpecs("13 кг", "0–3 роки", "книжка", "гумові надувні"),
    images: [],
    is_hit: true,
    is_sale: false,
  },
  {
    slug: "anex-mtype-2in1-denim-blue",
    name_ua: "Коляска Anex m/type 2 в 1 (Denim Blue)",
    name_ru: "Коляска Anex m/type 2 в 1 (Denim Blue)",
    description_ua:
      "Anex m/type — модульна коляска преміум-сегмента з посиленою рамою та плавним ходом на великих колесах. Глибока люлька з вентиляцією та прогулянковий блок з регульованим нахилом спинки підійдуть як для новонародженого, так і для активнішої дитини.",
    description_ru:
      "Anex m/type — модульная коляска премиум-сегмента с усиленной рамой и плавным ходом на больших колёсах. Глубокая люлька с вентиляцией и прогулочный блок с регулируемым наклоном спинки подойдут как новорождённому, так и подросшему малышу.",
    brand: "Anex",
    category_slug: "strollers-2in1",
    price: 47000,
    old_price: null,
    stock_status: "in_stock",
    specs: strollerSpecs("13 кг", "0–3 роки", "книжка", "гумові надувні"),
    images: [],
    is_hit: false,
    is_sale: false,
  },
  {
    slug: "anex-mtype-3in1-cappuccino",
    name_ua: "Коляска Anex m/type 3 в 1 (Cappuccino)",
    name_ru: "Коляска Anex m/type 3 в 1 (Cappuccino)",
    description_ua:
      "Повний комплект Anex m/type 3 в 1 доповнює модульне шасі автокріслом групи 0+, тож коляска легко перетворюється на автолюльку для поїздок. Один клік — і блоки міняються місцями без зайвих зусиль.",
    description_ru:
      "Полный комплект Anex m/type 3 в 1 дополняет модульное шасси автокреслом группы 0+, поэтому коляска легко превращается в автолюльку для поездок. Один щелчок — и блоки меняются местами без лишних усилий.",
    brand: "Anex",
    category_slug: "strollers-3in1",
    price: 52000,
    old_price: null,
    stock_status: "in_stock",
    specs: strollerSpecs("14.5 кг", "0–4 роки (з автокріслом)", "книжка", "гумові надувні"),
    images: [],
    is_hit: false,
    is_sale: false,
  },
  // --- Anex IQ (3в1) ---
  {
    slug: "anex-iq-3in1-amber",
    name_ua: "Коляска Anex IQ 3 в 1 (Amber)",
    name_ru: "Коляска Anex IQ 3 в 1 (Amber)",
    description_ua:
      "Anex IQ — флагманська лінійка бренду з рамою із авіаційного алюмінію та панорамним капюшоном з москітною сіткою. У комплекті люлька, прогулянковий блок та автокрісло — усе, що потрібно від виписки з пологового до трьох років.",
    description_ru:
      "Anex IQ — флагманская линейка бренда с рамой из авиационного алюминия и панорамным капюшоном с москитной сеткой. В комплекте люлька, прогулочный блок и автокресло — всё необходимое от выписки из роддома до трёх лет.",
    brand: "Anex",
    category_slug: "strollers-3in1",
    price: 54000,
    old_price: null,
    stock_status: "in_stock",
    specs: strollerSpecs("15 кг", "0–4 роки (з автокріслом)", "книжка одним рухом", "надувні"),
    images: [],
    is_hit: true,
    is_sale: false,
  },
  {
    slug: "anex-iq-3in1-berry",
    name_ua: "Коляска Anex IQ 3 в 1 (Berry)",
    name_ru: "Коляска Anex IQ 3 в 1 (Berry)",
    description_ua:
      "Anex IQ — флагманська лінійка бренду з рамою із авіаційного алюмінію та панорамним капюшоном з москітною сіткою. У комплекті люлька, прогулянковий блок та автокрісло — усе, що потрібно від виписки з пологового до трьох років.",
    description_ru:
      "Anex IQ — флагманская линейка бренда с рамой из авиационного алюминия и панорамным капюшоном с москитной сеткой. В комплекте люлька, прогулочный блок и автокресло — всё необходимое от выписки из роддома до трёх лет.",
    brand: "Anex",
    category_slug: "strollers-3in1",
    price: 54000,
    old_price: null,
    stock_status: "in_stock",
    specs: strollerSpecs("15 кг", "0–4 роки (з автокріслом)", "книжка одним рухом", "надувні"),
    images: [],
    is_hit: false,
    is_sale: false,
  },
  // --- Anex Air-X (прогулянкова) ---
  {
    slug: "anex-airx-graphite",
    name_ua: "Коляска Anex Air-X (Graphite)",
    name_ru: "Коляска Anex Air-X (Graphite)",
    description_ua:
      "Anex Air-X — легка прогулянкова коляска для активних батьків: складається одним рухом у компактний пакет і поміщається в багажник будь-якого авто. М'які надувні колеса згладжують нерівності бруківки та ґрунтових доріжок.",
    description_ru:
      "Anex Air-X — лёгкая прогулочная коляска для активных родителей: складывается одним движением в компактный пакет и помещается в багажник любого авто. Мягкие надувные колёса сглаживают неровности брусчатки и грунтовых дорожек.",
    brand: "Anex",
    category_slug: "strollers-buggy",
    price: 21000,
    old_price: 24000,
    stock_status: "in_stock",
    specs: strollerSpecs("8.9 кг", "6 міс – 3 роки", "парасолька", "надувні"),
    images: [],
    is_hit: false,
    is_sale: true,
  },
  {
    slug: "anex-airx-olive",
    name_ua: "Коляска Anex Air-X (Olive)",
    name_ru: "Коляска Anex Air-X (Olive)",
    description_ua:
      "Anex Air-X — легка прогулянкова коляска для активних батьків: складається одним рухом у компактний пакет і поміщається в багажник будь-якого авто. М'які надувні колеса згладжують нерівності бруківки та ґрунтових доріжок.",
    description_ru:
      "Anex Air-X — лёгкая прогулочная коляска для активных родителей: складывается одним движением в компактный пакет и помещается в багажник любого авто. Мягкие надувные колёса сглаживают неровности брусчатки и грунтовых дорожек.",
    brand: "Anex",
    category_slug: "strollers-buggy",
    price: 24000,
    old_price: null,
    stock_status: "in_stock",
    specs: strollerSpecs("8.9 кг", "6 міс – 3 роки", "парасолька", "надувні"),
    images: [],
    is_hit: false,
    is_sale: false,
  },
  // --- Anex Sport (прогулянкова) ---
  {
    slug: "anex-sport-black",
    name_ua: "Коляска Anex Sport (Black)",
    name_ru: "Коляска Anex Sport (Black)",
    description_ua:
      "Anex Sport розроблена для активного способу життя: збільшений кліренс, спортивна підвіска та зручна ручка-джойстик дозволяють впевнено долати бордюри й нерівні тротуари. Спинка розкладається у горизонт для денного сну.",
    description_ru:
      "Anex Sport создана для активного образа жизни: увеличенный клиренс, спортивная подвеска и удобная ручка-джойстик позволяют уверенно преодолевать бордюры и неровные тротуары. Спинка раскладывается в горизонт для дневного сна.",
    brand: "Anex",
    category_slug: "strollers-buggy",
    price: 19000,
    old_price: null,
    stock_status: "in_stock",
    specs: strollerSpecs("9.8 кг", "6 міс – 3 роки", "книжка", "EVA пінополіуретанові"),
    images: [],
    is_hit: false,
    is_sale: false,
  },
  {
    slug: "anex-sport-grey",
    name_ua: "Коляска Anex Sport (Grey)",
    name_ru: "Коляска Anex Sport (Grey)",
    description_ua:
      "Anex Sport розроблена для активного способу життя: збільшений кліренс, спортивна підвіска та зручна ручка-джойстик дозволяють впевнено долати бордюри й нерівні тротуари. Спинка розкладається у горизонт для денного сну.",
    description_ru:
      "Anex Sport создана для активного образа жизни: увеличенный клиренс, спортивная подвеска и удобная ручка-джойстик позволяют уверенно преодолевать бордюры и неровные тротуары. Спинка раскладывается в горизонт для дневного сна.",
    brand: "Anex",
    category_slug: "strollers-buggy",
    price: 19000,
    old_price: null,
    stock_status: "out_of_stock",
    specs: strollerSpecs("9.8 кг", "6 міс – 3 роки", "книжка", "EVA пінополіуретанові"),
    images: [],
    is_hit: false,
    is_sale: false,
  },
  // --- Anex L/type (3в1) ---
  {
    slug: "anex-ltype-3in1-chocolate",
    name_ua: "Коляска Anex L/type 3 в 1 (Chocolate)",
    name_ru: "Коляска Anex L/type 3 в 1 (Chocolate)",
    description_ua:
      "Anex L/type — нове покоління модульних колясок бренду з ще жорсткішою рамою та збільшеним кошиком для покупок. Комплект 3 в 1 включає люльку, прогулянковий блок і автокрісло для безшовних поїздок на авто.",
    description_ru:
      "Anex L/type — новое поколение модульных колясок бренда с ещё более жёсткой рамой и увеличенной корзиной для покупок. Комплект 3 в 1 включает люльку, прогулочный блок и автокресло для бесшовных поездок на авто.",
    brand: "Anex",
    category_slug: "strollers-3in1",
    price: 58000,
    old_price: null,
    stock_status: "preorder",
    specs: strollerSpecs("15.5 кг", "0–4 роки (з автокріслом)", "книжка одним рухом", "надувні"),
    images: [],
    is_hit: false,
    is_sale: false,
  },
  // --- Cybex Priam (3в1) ---
  {
    slug: "cybex-priam-deep-black",
    name_ua: "Коляска Cybex Priam 3 в 1 (Deep Black)",
    name_ru: "Коляска Cybex Priam 3 в 1 (Deep Black)",
    description_ua:
      "Cybex Priam — культова коляска з хромованою чи матовою рамою на вибір та підвіскою One-Hand Fold, яка складає шасі одним рухом навіть з люлькою всередині. Магнітні застібки та преміальна тканина підкреслюють статус моделі.",
    description_ru:
      "Cybex Priam — культовая коляска с хромированной или матовой рамой на выбор и подвеской One-Hand Fold, которая складывает шасси одним движением даже с люлькой внутри. Магнитные застёжки и премиальная ткань подчёркивают статус модели.",
    brand: "Cybex",
    category_slug: "strollers-3in1",
    price: 72000,
    old_price: null,
    stock_status: "in_stock",
    specs: strollerSpecs("14.2 кг", "0–4 роки (з автокріслом)", "One-Hand Fold одним рухом", "гумові надувні"),
    images: [],
    is_hit: true,
    is_sale: false,
  },
  {
    slug: "cybex-priam-nautical-blue",
    name_ua: "Коляска Cybex Priam 3 в 1 (Nautical Blue)",
    name_ru: "Коляска Cybex Priam 3 в 1 (Nautical Blue)",
    description_ua:
      "Cybex Priam — культова коляска з хромованою чи матовою рамою на вибір та підвіскою One-Hand Fold, яка складає шасі одним рухом навіть з люлькою всередині. Магнітні застібки та преміальна тканина підкреслюють статус моделі.",
    description_ru:
      "Cybex Priam — культовая коляска с хромированной или матовой рамой на выбор и подвеской One-Hand Fold, которая складывает шасси одним движением даже с люлькой внутри. Магнитные застёжки и премиальная ткань подчёркивают статус модели.",
    brand: "Cybex",
    category_slug: "strollers-3in1",
    price: 72000,
    old_price: null,
    stock_status: "in_stock",
    specs: strollerSpecs("14.2 кг", "0–4 роки (з автокріслом)", "One-Hand Fold одним рухом", "гумові надувні"),
    images: [],
    is_hit: false,
    is_sale: false,
  },
  {
    slug: "cybex-priam-autumn-gold",
    name_ua: "Коляска Cybex Priam 3 в 1 (Autumn Gold)",
    name_ru: "Коляска Cybex Priam 3 в 1 (Autumn Gold)",
    description_ua:
      "Cybex Priam — культова коляска з хромованою чи матовою рамою на вибір та підвіскою One-Hand Fold, яка складає шасі одним рухом навіть з люлькою всередині. Магнітні застібки та преміальна тканина підкреслюють статус моделі.",
    description_ru:
      "Cybex Priam — культовая коляска с хромированной или матовой рамой на выбор и подвеской One-Hand Fold, которая складывает шасси одним движением даже с люлькой внутри. Магнитные застёжки и премиальная ткань подчёркивают статус модели.",
    brand: "Cybex",
    category_slug: "strollers-3in1",
    price: 75000,
    old_price: null,
    stock_status: "in_stock",
    specs: strollerSpecs("14.2 кг", "0–4 роки (з автокріслом)", "One-Hand Fold одним рухом", "гумові надувні"),
    images: [],
    is_hit: false,
    is_sale: false,
  },
  // --- Cybex Mios (2в1 та 3в1) ---
  {
    slug: "cybex-mios-2in1-lava-red",
    name_ua: "Коляска Cybex Mios 2 в 1 (Lava Red)",
    name_ru: "Коляска Cybex Mios 2 в 1 (Lava Red)",
    description_ua:
      "Cybex Mios — найлегша модульна коляска бренду, зроблена з алюмінію авіаційного класу. Складається у компактний пакет однією рукою і легко переноситься за ремінець, а змінні дизайнерські панелі дозволяють освіжити вигляд без покупки нової коляски.",
    description_ru:
      "Cybex Mios — самая лёгкая модульная коляска бренда, выполненная из алюминия авиационного класса. Складывается в компактный пакет одной рукой и легко переносится за ремешок, а сменные дизайнерские панели позволяют освежить вид без покупки новой коляски.",
    brand: "Cybex",
    category_slug: "strollers-2in1",
    price: 58000,
    old_price: null,
    stock_status: "in_stock",
    specs: strollerSpecs("10.9 кг", "0–3 роки", "компактне одним рухом", "гумові надувні"),
    images: [],
    is_hit: true,
    is_sale: false,
  },
  {
    slug: "cybex-mios-2in1-soho-grey",
    name_ua: "Коляска Cybex Mios 2 в 1 (Soho Grey)",
    name_ru: "Коляска Cybex Mios 2 в 1 (Soho Grey)",
    description_ua:
      "Cybex Mios — найлегша модульна коляска бренду, зроблена з алюмінію авіаційного класу. Складається у компактний пакет однією рукою і легко переноситься за ремінець, а змінні дизайнерські панелі дозволяють освіжити вигляд без покупки нової коляски.",
    description_ru:
      "Cybex Mios — самая лёгкая модульная коляска бренда, выполненная из алюминия авиационного класса. Складывается в компактный пакет одной рукой и легко переносится за ремешок, а сменные дизайнерские панели позволяют освежить вид без покупки новой коляски.",
    brand: "Cybex",
    category_slug: "strollers-2in1",
    price: 52000,
    old_price: 58000,
    stock_status: "in_stock",
    specs: strollerSpecs("10.9 кг", "0–3 роки", "компактне одним рухом", "гумові надувні"),
    images: [],
    is_hit: false,
    is_sale: true,
  },
  {
    slug: "cybex-mios-3in1-sepia-black",
    name_ua: "Коляска Cybex Mios 3 в 1 (Sepia Black)",
    name_ru: "Коляска Cybex Mios 3 в 1 (Sepia Black)",
    description_ua:
      "Комплект Cybex Mios 3 в 1 додає до фірмової легкої рами автокрісло групи 0+ із системою кріплення без бази. Це рішення для сімей, яким потрібна одна коляска на всі випадки — від пологового будинку до поїздок на авто.",
    description_ru:
      "Комплект Cybex Mios 3 в 1 добавляет к фирменной лёгкой раме автокресло группы 0+ с системой крепления без базы. Это решение для семей, которым нужна одна коляска на все случаи — от роддома до поездок на авто.",
    brand: "Cybex",
    category_slug: "strollers-3in1",
    price: 63000,
    old_price: null,
    stock_status: "in_stock",
    specs: strollerSpecs("12.4 кг", "0–4 роки (з автокріслом)", "компактне одним рухом", "гумові надувні"),
    images: [],
    is_hit: false,
    is_sale: false,
  },
  // --- Cybex Balios S (прогулянкова) ---
  {
    slug: "cybex-balios-s-cozy-beige",
    name_ua: "Коляска Cybex Balios S Lux (Cozy Beige)",
    name_ru: "Коляска Cybex Balios S Lux (Cozy Beige)",
    description_ua:
      "Cybex Balios S Lux — прогулянкова коляска з великим капюшоном UV 50+ та плавним ходом на надувних колесах. Знімний бампер, глибокий відкидний козирок і зручний кошик роблять її практичним вибором для щоденних прогулянок.",
    description_ru:
      "Cybex Balios S Lux — прогулочная коляска с большим капюшоном UV 50+ и плавным ходом на надувных колёсах. Съёмный бампер, глубокий откидной козырёк и вместительная корзина делают её практичным выбором для ежедневных прогулок.",
    brand: "Cybex",
    category_slug: "strollers-buggy",
    price: 29000,
    old_price: null,
    stock_status: "in_stock",
    specs: strollerSpecs("10.4 кг", "6 міс – 4 роки", "компактне", "надувні"),
    images: [],
    is_hit: true,
    is_sale: false,
  },
  {
    slug: "cybex-balios-s-lava-red",
    name_ua: "Коляска Cybex Balios S Lux (Lava Red)",
    name_ru: "Коляска Cybex Balios S Lux (Lava Red)",
    description_ua:
      "Cybex Balios S Lux — прогулянкова коляска з великим капюшоном UV 50+ та плавним ходом на надувних колесах. Знімний бампер, глибокий відкидний козирок і зручний кошик роблять її практичним вибором для щоденних прогулянок.",
    description_ru:
      "Cybex Balios S Lux — прогулочная коляска с большим капюшоном UV 50+ и плавным ходом на надувных колёсах. Съёмный бампер, глубокий откидной козырёк и вместительная корзина делают её практичным выбором для ежедневных прогулок.",
    brand: "Cybex",
    category_slug: "strollers-buggy",
    price: 29000,
    old_price: null,
    stock_status: "in_stock",
    specs: strollerSpecs("10.4 кг", "6 міс – 4 роки", "компактне", "надувні"),
    images: [],
    is_hit: false,
    is_sale: false,
  },
  // --- Cybex Eezy S Twist+2 (прогулянкова) ---
  {
    slug: "cybex-eezy-s-twist2-cashmere-beige",
    name_ua: "Коляска Cybex Eezy S Twist+2 (Cashmere Beige)",
    name_ru: "Коляска Cybex Eezy S Twist+2 (Cashmere Beige)",
    description_ua:
      "Cybex Eezy S Twist+2 має унікальне сидіння, що обертається на 360°, — дитину можна розвернути обличчям до мами без розвороту всієї коляски. Складається компактно однією рукою і підходить для подорожей у ручній поклажі.",
    description_ru:
      "Cybex Eezy S Twist+2 оснащена уникальным сиденьем с поворотом на 360° — ребёнка можно развернуть лицом к маме без разворота всей коляски. Складывается компактно одной рукой и подходит для поездок в ручной клади.",
    brand: "Cybex",
    category_slug: "strollers-buggy",
    price: 23000,
    old_price: 26000,
    stock_status: "in_stock",
    specs: strollerSpecs("9.7 кг", "0–3.5 років", "компактне одним рухом", "гумові надувні"),
    images: [],
    is_hit: false,
    is_sale: true,
  },
  {
    slug: "cybex-eezy-s-twist2-moon-black",
    name_ua: "Коляска Cybex Eezy S Twist+2 (Moon Black)",
    name_ru: "Коляска Cybex Eezy S Twist+2 (Moon Black)",
    description_ua:
      "Cybex Eezy S Twist+2 має унікальне сидіння, що обертається на 360°, — дитину можна розвернути обличчям до мами без розвороту всієї коляски. Складається компактно однією рукою і підходить для подорожей у ручній поклажі.",
    description_ru:
      "Cybex Eezy S Twist+2 оснащена уникальным сиденьем с поворотом на 360° — ребёнка можно развернуть лицом к маме без разворота всей коляски. Складывается компактно одной рукой и подходит для поездок в ручной клади.",
    brand: "Cybex",
    category_slug: "strollers-buggy",
    price: 26000,
    old_price: null,
    stock_status: "in_stock",
    specs: strollerSpecs("9.7 кг", "0–3.5 років", "компактне одним рухом", "гумові надувні"),
    images: [],
    is_hit: false,
    is_sale: false,
  },
  // --- Cybex Cloud T i-Size (автокрісло) ---
  {
    slug: "cybex-cloud-t-isize-sepia-black",
    name_ua: "Автокрісло Cybex Cloud T i-Size (Sepia Black)",
    name_ru: "Автокресло Cybex Cloud T i-Size (Sepia Black)",
    description_ua:
      "Cybex Cloud T i-Size — автокрісло-люлька для найменших з поворотом на 360° та вбудованим лінійним поглиначем удару. Встановлюється лише на базу ISOFIX, а функція гойдання заспокоює малюка навіть у припаркованому авто.",
    description_ru:
      "Cybex Cloud T i-Size — автокресло-люлька для самых маленьких с поворотом на 360° и встроенным линейным амортизатором удара. Устанавливается только на базу ISOFIX, а функция укачивания успокаивает малыша даже в припаркованном авто.",
    brand: "Cybex",
    category_slug: "car-seats-0plus",
    price: 33000,
    old_price: null,
    stock_status: "in_stock",
    specs: carSeatSpecs("6.4 кг", "0+ (до 87 см)", "ISOFIX (лише з базою)", "45–87 см"),
    images: [],
    is_hit: true,
    is_sale: false,
  },
  {
    slug: "cybex-cloud-t-isize-seashell-beige",
    name_ua: "Автокрісло Cybex Cloud T i-Size (Seashell Beige)",
    name_ru: "Автокресло Cybex Cloud T i-Size (Seashell Beige)",
    description_ua:
      "Cybex Cloud T i-Size — автокрісло-люлька для найменших з поворотом на 360° та вбудованим лінійним поглиначем удару. Встановлюється лише на базу ISOFIX, а функція гойдання заспокоює малюка навіть у припаркованому авто.",
    description_ru:
      "Cybex Cloud T i-Size — автокресло-люлька для самых маленьких с поворотом на 360° и встроенным линейным амортизатором удара. Устанавливается только на базу ISOFIX, а функция укачивания успокаивает малыша даже в припаркованном авто.",
    brand: "Cybex",
    category_slug: "car-seats-0plus",
    price: 33000,
    old_price: null,
    stock_status: "in_stock",
    specs: carSeatSpecs("6.4 кг", "0+ (до 87 см)", "ISOFIX (лише з базою)", "45–87 см"),
    images: [],
    is_hit: false,
    is_sale: false,
  },
  // --- Cybex Sirona T i-Size (автокрісло) ---
  {
    slug: "cybex-sirona-t-isize-plum",
    name_ua: "Автокрісло Cybex Sirona T i-Size (Plum)",
    name_ru: "Автокресло Cybex Sirona T i-Size (Plum)",
    description_ua:
      "Cybex Sirona T i-Size росте разом із дитиною від народження до 4 років і обертається на 360° для зручного саджання без нахилу над салоном. Проти-ротаційна опора та бокова система захисту забезпечують додаткову безпеку при боковому ударі.",
    description_ru:
      "Cybex Sirona T i-Size растёт вместе с ребёнком от рождения до 4 лет и поворачивается на 360° для удобной посадки без наклона над салоном. Противоротационная опора и боковая система защиты обеспечивают дополнительную безопасность при боковом ударе.",
    brand: "Cybex",
    category_slug: "car-seats-isize",
    price: 41000,
    old_price: 46000,
    stock_status: "in_stock",
    specs: carSeatSpecs("13.5 кг", "0+/I/II (до 105 см)", "ISOFIX + опора", "45–105 см"),
    images: [],
    is_hit: false,
    is_sale: true,
  },
  {
    slug: "cybex-sirona-t-isize-graphite-black",
    name_ua: "Автокрісло Cybex Sirona T i-Size (Graphite Black)",
    name_ru: "Автокресло Cybex Sirona T i-Size (Graphite Black)",
    description_ua:
      "Cybex Sirona T i-Size росте разом із дитиною від народження до 4 років і обертається на 360° для зручного саджання без нахилу над салоном. Проти-ротаційна опора та бокова система захисту забезпечують додаткову безпеку при боковому ударі.",
    description_ru:
      "Cybex Sirona T i-Size растёт вместе с ребёнком от рождения до 4 лет и поворачивается на 360° для удобной посадки без наклона над салоном. Противоротационная опора и боковая система защиты обеспечивают дополнительную безопасность при боковом ударе.",
    brand: "Cybex",
    category_slug: "car-seats-isize",
    price: 46000,
    old_price: null,
    stock_status: "preorder",
    specs: carSeatSpecs("13.5 кг", "0+/I/II (до 105 см)", "ISOFIX + опора", "45–105 см"),
    images: [],
    is_hit: false,
    is_sale: false,
  },
  // --- Cybex Libelle (прогулянкова) ---
  {
    slug: "cybex-libelle-moon-black",
    name_ua: "Коляска Cybex Libelle (Moon Black)",
    name_ru: "Коляска Cybex Libelle (Moon Black)",
    description_ua:
      "Cybex Libelle — ультракомпактна коляска, яка складається одним рухом і стоїть самостійно у складеному вигляді, а розмір дозволяє класти її на верхню полицю в літаку. При цьому спинка відкидається у майже горизонтальне положення для сну.",
    description_ru:
      "Cybex Libelle — ультракомпактная коляска, которая складывается одним движением и стоит самостоятельно в сложенном виде, а размер позволяет класть её на верхнюю полку в самолёте. При этом спинка откидывается в почти горизонтальное положение для сна.",
    brand: "Cybex",
    category_slug: "strollers-buggy",
    price: 30000,
    old_price: 34000,
    stock_status: "in_stock",
    specs: strollerSpecs("7.3 кг", "6 міс – 4 роки", "одним рухом, стоїть складена", "поліуретанові"),
    images: [],
    is_hit: false,
    is_sale: true,
  },
  // --- Cybex Coya (прогулянкова) ---
  {
    slug: "cybex-coya-seashell-beige",
    name_ua: "Коляска Cybex Coya (Seashell Beige)",
    name_ru: "Коляска Cybex Coya (Seashell Beige)",
    description_ua:
      "Cybex Coya поєднує компактність міської коляски з преміальним оздобленням: шкіряна ручка, матова рама та обʼємний капюшон із виходом для сонця. Підходить від народження завдяки глибокому відкиданню спинки в горизонт.",
    description_ru:
      "Cybex Coya сочетает компактность городской коляски с премиальной отделкой: кожаная ручка, матовая рама и объёмный капюшон с окном для солнца. Подходит с рождения благодаря глубокому откидыванию спинки в горизонт.",
    brand: "Cybex",
    category_slug: "strollers-buggy",
    price: 45000,
    old_price: null,
    stock_status: "in_stock",
    specs: strollerSpecs("8.9 кг", "0–4 роки", "компактне одним рухом", "поліуретанові"),
    images: [],
    is_hit: false,
    is_sale: false,
  },
  // --- Cybex Aton B2 (автокрісло) ---
  {
    slug: "cybex-aton-b2-lava-red",
    name_ua: "Автокрісло Cybex Aton B2 (Lava Red)",
    name_ru: "Автокресло Cybex Aton B2 (Lava Red)",
    description_ua:
      "Cybex Aton B2 — легке автокрісло групи 0+ для перших поїздок немовляти, сумісне з більшістю шасі колясок Cybex та Anex через фірмові адаптери. Лінійний поглинач удару в зоні голови підвищує захист при бічному зіткненні.",
    description_ru:
      "Cybex Aton B2 — лёгкое автокресло группы 0+ для первых поездок младенца, совместимое с большинством шасси колясок Cybex и Anex через фирменные адаптеры. Линейный амортизатор удара в зоне головы повышает защиту при боковом столкновении.",
    brand: "Cybex",
    category_slug: "car-seats-0plus",
    price: 21000,
    old_price: null,
    stock_status: "in_stock",
    specs: carSeatSpecs("3.6 кг", "0+ (до 13 кг)", "ремені авто / адаптери на коляску", "45–76 см"),
    images: [],
    is_hit: false,
    is_sale: false,
  },
  // --- Cybex Pallas G i-Size (автокрісло) ---
  {
    slug: "cybex-pallas-g-isize-graphite-black",
    name_ua: "Автокрісло Cybex Pallas G i-Size (Graphite Black)",
    name_ru: "Автокресло Cybex Pallas G i-Size (Graphite Black)",
    description_ua:
      "Cybex Pallas G i-Size розраховане на дітей від 3 до 12 років і трансформується з крісла зі спинкою на бустер без спинки в міру дорослішання дитини. Регулювання по 12 позиціях висоти підголівника підлаштовується під зростання без заміни крісла.",
    description_ru:
      "Cybex Pallas G i-Size рассчитано на детей от 3 до 12 лет и трансформируется из кресла со спинкой в бустер без спинки по мере взросления ребёнка. Регулировка по 12 позициям высоты подголовника подстраивается под рост без замены кресла.",
    brand: "Cybex",
    category_slug: "car-seats-boosters",
    price: 27000,
    old_price: null,
    stock_status: "out_of_stock",
    specs: carSeatSpecs("6.9 кг", "II/III (100–150 см)", "ISOFIX + ремені авто", "100–150 см"),
    images: [],
    is_hit: false,
    is_sale: false,
  },
  // --- Espiro Next Avenue (3в1) ---
  {
    slug: "espiro-next-avenue-grey",
    name_ua: "Коляска Espiro Next Avenue 3 в 1 (2026, Grey)",
    name_ru: "Коляска Espiro Next Avenue 3 в 1 (2026, Grey)",
    description_ua:
      "Espiro Next Avenue — доступний комплект 3 в 1 з люлькою, прогулянковим блоком та автокріслом групи 0+ в одній коробці. Велике колесо переднього поворотного модуля та амортизація на задній осі дають плавний хід навіть на бруківці.",
    description_ru:
      "Espiro Next Avenue — доступный комплект 3 в 1 с люлькой, прогулочным блоком и автокреслом группы 0+ в одной коробке. Большое поворотное переднее колесо и амортизация на задней оси обеспечивают плавный ход даже на брусчатке.",
    brand: "Espiro",
    category_slug: "strollers-3in1",
    price: 21000,
    old_price: null,
    stock_status: "in_stock",
    specs: strollerSpecs("13.8 кг", "0–4 роки (з автокріслом)", "книжка", "гумові надувні"),
    images: [],
    is_hit: true,
    is_sale: false,
  },
  {
    slug: "espiro-next-avenue-beige",
    name_ua: "Коляска Espiro Next Avenue 3 в 1 (2026, Beige)",
    name_ru: "Коляска Espiro Next Avenue 3 в 1 (2026, Beige)",
    description_ua:
      "Espiro Next Avenue — доступний комплект 3 в 1 з люлькою, прогулянковим блоком та автокріслом групи 0+ в одній коробці. Велике колесо переднього поворотного модуля та амортизація на задній осі дають плавний хід навіть на бруківці.",
    description_ru:
      "Espiro Next Avenue — доступный комплект 3 в 1 с люлькой, прогулочным блоком и автокреслом группы 0+ в одной коробке. Большое поворотное переднее колесо и амортизация на задней оси обеспечивают плавный ход даже на брусчатке.",
    brand: "Espiro",
    category_slug: "strollers-3in1",
    price: 21000,
    old_price: null,
    stock_status: "in_stock",
    specs: strollerSpecs("13.8 кг", "0–4 роки (з автокріслом)", "книжка", "гумові надувні"),
    images: [],
    is_hit: false,
    is_sale: false,
  },
  // --- Espiro Only Way (2в1) ---
  {
    slug: "espiro-only-way-denim",
    name_ua: "Коляска Espiro Only Way 2 в 1 (Denim)",
    name_ru: "Коляска Espiro Only Way 2 в 1 (Denim)",
    description_ua:
      "Espiro Only Way — бюджетна модульна коляска для тих, хто цінує практичність: люлька з жорстким дном і прогулянковий блок кріпляться на одне шасі без зайвих адаптерів. Знімні чохли легко прати в машинці.",
    description_ru:
      "Espiro Only Way — бюджетная модульная коляска для тех, кто ценит практичность: люлька с жёстким дном и прогулочный блок крепятся на одно шасси без лишних адаптеров. Съёмные чехлы легко стирать в машинке.",
    brand: "Espiro",
    category_slug: "strollers-2in1",
    price: 16000,
    old_price: null,
    stock_status: "in_stock",
    specs: strollerSpecs("11 кг", "0–3 роки", "книжка", "гумові надувні"),
    images: [],
    is_hit: true,
    is_sale: false,
  },
  {
    slug: "espiro-only-way-grafit",
    name_ua: "Коляска Espiro Only Way 2 в 1 (Grafit)",
    name_ru: "Коляска Espiro Only Way 2 в 1 (Grafit)",
    description_ua:
      "Espiro Only Way — бюджетна модульна коляска для тих, хто цінує практичність: люлька з жорстким дном і прогулянковий блок кріпляться на одне шасі без зайвих адаптерів. Знімні чохли легко прати в машинці.",
    description_ru:
      "Espiro Only Way — бюджетная модульная коляска для тех, кто ценит практичность: люлька с жёстким дном и прогулочный блок крепятся на одно шасси без лишних адаптеров. Съёмные чехлы легко стирать в машинке.",
    brand: "Espiro",
    category_slug: "strollers-2in1",
    price: 14000,
    old_price: 16000,
    stock_status: "in_stock",
    specs: strollerSpecs("11 кг", "0–3 роки", "книжка", "гумові надувні"),
    images: [],
    is_hit: false,
    is_sale: true,
  },
  // --- Espiro Sonic Air (прогулянкова) ---
  {
    slug: "espiro-sonic-air-mint",
    name_ua: "Коляска Espiro Sonic Air (Mint)",
    name_ru: "Коляска Espiro Sonic Air (Mint)",
    description_ua:
      "Espiro Sonic Air — легка прогулянкова коляска на надувних колесах за доступною ціною. Компактне складання «парасолька» та невелика вага роблять її зручною для поїздок громадським транспортом і подорожей.",
    description_ru:
      "Espiro Sonic Air — лёгкая прогулочная коляска на надувных колёсах по доступной цене. Компактное складывание «зонтик» и небольшой вес делают её удобной для поездок в общественном транспорте и путешествий.",
    brand: "Espiro",
    category_slug: "strollers-buggy",
    price: 11000,
    old_price: null,
    stock_status: "in_stock",
    specs: strollerSpecs("7.8 кг", "6 міс – 3 роки", "парасолька", "надувні"),
    images: [],
    is_hit: true,
    is_sale: false,
  },
  {
    slug: "espiro-sonic-air-black",
    name_ua: "Коляска Espiro Sonic Air (Black)",
    name_ru: "Коляска Espiro Sonic Air (Black)",
    description_ua:
      "Espiro Sonic Air — легка прогулянкова коляска на надувних колесах за доступною ціною. Компактне складання «парасолька» та невелика вага роблять її зручною для поїздок громадським транспортом і подорожей.",
    description_ru:
      "Espiro Sonic Air — лёгкая прогулочная коляска на надувных колёсах по доступной цене. Компактное складывание «зонтик» и небольшой вес делают её удобной для поездок в общественном транспорте и путешествий.",
    brand: "Espiro",
    category_slug: "strollers-buggy",
    price: 11000,
    old_price: null,
    stock_status: "in_stock",
    specs: strollerSpecs("7.8 кг", "6 міс – 3 роки", "парасолька", "надувні"),
    images: [],
    is_hit: false,
    is_sale: false,
  },
  // --- Espiro Wave (прогулянкова) ---
  {
    slug: "espiro-wave-red",
    name_ua: "Коляска Espiro Wave (Red)",
    name_ru: "Коляска Espiro Wave (Red)",
    description_ua:
      "Espiro Wave — найдоступніша прогулянкова коляска лінійки для щоденних коротких прогулянок. Проста конструкція без зайвих механізмів означає менше поломок і легкий ремонт.",
    description_ru:
      "Espiro Wave — самая доступная прогулочная коляска линейки для ежедневных коротких прогулок. Простая конструкция без лишних механизмов означает меньше поломок и лёгкий ремонт.",
    brand: "Espiro",
    category_slug: "strollers-buggy",
    price: 7500,
    old_price: 9000,
    stock_status: "in_stock",
    specs: strollerSpecs("6.9 кг", "6 міс – 3 роки", "парасолька", "EVA пінополіуретанові"),
    images: [],
    is_hit: false,
    is_sale: true,
  },
  {
    slug: "espiro-wave-navy",
    name_ua: "Коляска Espiro Wave (Navy)",
    name_ru: "Коляска Espiro Wave (Navy)",
    description_ua:
      "Espiro Wave — найдоступніша прогулянкова коляска лінійки для щоденних коротких прогулянок. Проста конструкція без зайвих механізмів означає менше поломок і легкий ремонт.",
    description_ru:
      "Espiro Wave — самая доступная прогулочная коляска линейки для ежедневных коротких прогулок. Простая конструкция без лишних механизмов означает меньше поломок и лёгкий ремонт.",
    brand: "Espiro",
    category_slug: "strollers-buggy",
    price: 9000,
    old_price: null,
    stock_status: "in_stock",
    specs: strollerSpecs("6.9 кг", "6 міс – 3 роки", "парасолька", "EVA пінополіуретанові"),
    images: [],
    is_hit: false,
    is_sale: false,
  },
  // --- Espiro Rowan (3в1) ---
  {
    slug: "espiro-rowan-grey",
    name_ua: "Коляска Espiro Rowan 3 в 1 (Grey)",
    name_ru: "Коляска Espiro Rowan 3 в 1 (Grey)",
    description_ua:
      "Espiro Rowan — новинка лінійки з оновленим дизайном рами та збільшеним обʼємом кошика для покупок. Комплект 3 в 1 включає люльку з вентиляційними отворами, прогулянковий блок і автокрісло групи 0+.",
    description_ru:
      "Espiro Rowan — новинка линейки с обновлённым дизайном рамы и увеличенным объёмом корзины для покупок. Комплект 3 в 1 включает люльку с вентиляционными отверстиями, прогулочный блок и автокресло группы 0+.",
    brand: "Espiro",
    category_slug: "strollers-3in1",
    price: 23000,
    old_price: null,
    stock_status: "preorder",
    specs: strollerSpecs("14 кг", "0–4 роки (з автокріслом)", "книжка", "гумові надувні"),
    images: [],
    is_hit: false,
    is_sale: false,
  },
  // --- Espiro Q5 (прогулянкова) ---
  {
    slug: "espiro-q5-beige",
    name_ua: "Коляска Espiro Q5 (Beige)",
    name_ru: "Коляска Espiro Q5 (Beige)",
    description_ua:
      "Espiro Q5 — прогулянкова коляска середнього класу з посиленими колесами та регульованою в трьох положеннях спинкою. Знімний чохол на ніжки та капюшон із додатковою вставкою захищають від вітру в прохолодну погоду.",
    description_ru:
      "Espiro Q5 — прогулочная коляска среднего класса с усиленными колёсами и спинкой, регулируемой в трёх положениях. Съёмный чехол на ножки и капюшон с дополнительной вставкой защищают от ветра в прохладную погоду.",
    brand: "Espiro",
    category_slug: "strollers-buggy",
    price: 10500,
    old_price: null,
    stock_status: "in_stock",
    specs: strollerSpecs("8.4 кг", "6 міс – 3 роки", "книжка", "гумові надувні"),
    images: [],
    is_hit: false,
    is_sale: false,
  },
  // --- Espiro Bueno (2в1) ---
  {
    slug: "espiro-bueno-blue",
    name_ua: "Коляска Espiro Bueno 2 в 1 (Blue)",
    name_ru: "Коляска Espiro Bueno 2 в 1 (Blue)",
    description_ua:
      "Espiro Bueno поєднує класичну люльку з жорстким каркасом та прогулянковий блок на одному шасі за доступну ціну. Великий капюшон із віконцем дозволяє батькам стежити за дитиною під час сну на вулиці.",
    description_ru:
      "Espiro Bueno сочетает классическую люльку с жёстким каркасом и прогулочный блок на одном шасси по доступной цене. Большой капюшон с окошком позволяет родителям следить за ребёнком во время сна на улице.",
    brand: "Espiro",
    category_slug: "strollers-2in1",
    price: 15000,
    old_price: null,
    stock_status: "in_stock",
    specs: strollerSpecs("10.6 кг", "0–3 роки", "книжка", "гумові надувні"),
    images: [],
    is_hit: false,
    is_sale: false,
  },
  // --- Аксесуари ---
  {
    slug: "anex-raincover-universal",
    name_ua: "Дощовик універсальний Anex",
    name_ru: "Дождевик универсальный Anex",
    description_ua:
      "Прозорий дощовик з ПВХ підходить для більшості прогулянкових і модульних колясок. Вентиляційні отвори запобігають запотіванню, а компактне складання дозволяє завжди носити його в кошику коляски про запас.",
    description_ru:
      "Прозрачный дождевик из ПВХ подходит для большинства прогулочных и модульных колясок. Вентиляционные отверстия предотвращают запотевание, а компактное складывание позволяет всегда носить его в корзине коляски про запас.",
    brand: "Anex",
    category_slug: "accessories-stroller",
    price: 450,
    old_price: null,
    stock_status: "in_stock",
    specs: accessorySpecs("ПВХ без запаху", "більшість колясок 2в1/3в1/прогулянкових", "протирати вологою тканиною"),
    images: [],
    is_hit: false,
    is_sale: false,
  },
  {
    slug: "anex-mosquito-net-universal",
    name_ua: "Москітна сітка універсальна Anex",
    name_ru: "Москитная сетка универсальная Anex",
    description_ua:
      "Дрібна сітка захищає дитину від комах на прогулянці, не заважаючи циркуляції повітря. Легко натягується на капюшон і кріпиться гумками, а складається в невеликий мішечок для зберігання.",
    description_ru:
      "Мелкая сетка защищает ребёнка от насекомых на прогулке, не мешая циркуляции воздуха. Легко натягивается на капюшон и крепится резинками, а складывается в небольшой мешочек для хранения.",
    brand: "Anex",
    category_slug: "accessories-stroller",
    price: 350,
    old_price: null,
    stock_status: "in_stock",
    specs: accessorySpecs("поліестерна сітка", "більшість колясок", "ручне прання"),
    images: [],
    is_hit: false,
    is_sale: false,
  },
  {
    slug: "anex-footmuff-winter",
    name_ua: "Конверт зимовий для коляски Anex",
    name_ru: "Конверт зимний для коляски Anex",
    description_ua:
      "Утеплений конверт з мембранною зовнішньою тканиною та хутряною підкладкою тримає тепло в найхолодніші дні. Двобічна блискавка дозволяє регулювати довжину та легко пристібати конверт до ременів безпеки.",
    description_ru:
      "Утеплённый конверт с мембранной внешней тканью и меховой подкладкой сохраняет тепло в самые холодные дни. Двусторонняя молния позволяет регулировать длину и легко пристёгивать конверт к ремням безопасности.",
    brand: "Anex",
    category_slug: "footmuffs",
    price: 2200,
    old_price: null,
    stock_status: "in_stock",
    specs: accessorySpecs("мембрана + штучне хутро", "універсальний, з прорізами для ременів", "прання при 30°C"),
    images: [],
    is_hit: false,
    is_sale: false,
  },
  {
    slug: "cybex-raincover",
    name_ua: "Дощовик для колясок Cybex",
    name_ru: "Дождевик для колясок Cybex",
    description_ua:
      "Фірмовий дощовик Cybex пошитий за формою прогулянкових блоків бренду для щільного прилягання без зазорів. Прозорий матеріал не спотворює огляд дитині, а невелика вага не обтяжує складену коляску.",
    description_ru:
      "Фирменный дождевик Cybex скроен по форме прогулочных блоков бренда для плотного прилегания без зазоров. Прозрачный материал не искажает обзор ребёнку, а небольшой вес не утяжеляет сложенную коляску.",
    brand: "Cybex",
    category_slug: "accessories-stroller",
    price: 900,
    old_price: null,
    stock_status: "in_stock",
    specs: accessorySpecs("ПВХ без фталатів", "Balios S, Eezy S, Mios, Priam", "протирати вологою тканиною"),
    images: [],
    is_hit: false,
    is_sale: false,
  },
  {
    slug: "cybex-cup-holder",
    name_ua: "Підстаканник універсальний Cybex",
    name_ru: "Подстаканник универсальный Cybex",
    description_ua:
      "Підстаканник кріпиться на поручень коляски за лічені секунди й тримає пляшечку або чашку кави без розхитування. Знімається для миття в посудомийній машині.",
    description_ru:
      "Подстаканник крепится на поручень коляски за считаные секунды и удерживает бутылочку или чашку кофе без раскачивания. Снимается для мытья в посудомоечной машине.",
    brand: "Cybex",
    category_slug: "accessories-stroller",
    price: 550,
    old_price: null,
    stock_status: "in_stock",
    specs: accessorySpecs("пластик + силіконова вставка", "більшість колясок з круглим поручнем", "мити в посудомийній машині"),
    images: [],
    is_hit: false,
    is_sale: false,
  },
  {
    slug: "cybex-sun-canopy",
    name_ua: "Сонцезахисний козирок Cybex",
    name_ru: "Солнцезащитный козырёк Cybex",
    description_ua:
      "Додатковий козирок з UV-захистом кріпиться поверх штатного капюшона і затінює обличчя дитини у сонячні дні. Гнучкий каркас дозволяє налаштувати кут нахилу під висоту сонця.",
    description_ru:
      "Дополнительный козырёк с UV-защитой крепится поверх штатного капюшона и затеняет лицо ребёнка в солнечные дни. Гибкий каркас позволяет настроить угол наклона под высоту солнца.",
    brand: "Cybex",
    category_slug: "accessories-stroller",
    price: 800,
    old_price: null,
    stock_status: "in_stock",
    specs: accessorySpecs("тканина з UV 50+", "більшість прогулянкових колясок", "протирати вологою тканиною"),
    images: [],
    is_hit: false,
    is_sale: false,
  },
  {
    slug: "espiro-changing-bag",
    name_ua: "Сумка для мами Espiro",
    name_ru: "Сумка для мамы Espiro",
    description_ua:
      "Містка сумка з кріпленнями на ручку коляски має окремі відділення для підгузків, пляшечок і особистих речей. У комплекті — водовідштовхувальний килимок для сповивання.",
    description_ru:
      "Вместительная сумка с креплениями на ручку коляски имеет отдельные отделения для подгузников, бутылочек и личных вещей. В комплекте — водоотталкивающий коврик для пеленания.",
    brand: "Espiro",
    category_slug: "accessories-stroller",
    price: 1800,
    old_price: null,
    stock_status: "in_stock",
    specs: accessorySpecs("водовідштовхувальний поліестер", "кріпиться на будь-яку ручку коляски", "протирати вологою тканиною"),
    images: [],
    is_hit: false,
    is_sale: false,
  },
  {
    slug: "espiro-newborn-insert",
    name_ua: "Вкладиш для новонародженого Espiro",
    name_ru: "Вкладыш для новорождённого Espiro",
    description_ua:
      "М'який вкладиш підтримує голову й спину новонародженого в прогулянковому блоці або автокріслі, доки дитина не підросте. Знімний чохол легко прати при низькій температурі.",
    description_ru:
      "Мягкий вкладыш поддерживает голову и спину новорождённого в прогулочном блоке или автокресле, пока ребёнок не подрастёт. Съёмный чехол легко стирать при низкой температуре.",
    brand: "Espiro",
    category_slug: "accessories-carseat",
    price: 950,
    old_price: null,
    stock_status: "in_stock",
    specs: accessorySpecs("бавовна + поролон", "прогулянкові блоки та автокрісла групи 0+", "прання при 30°C"),
    images: [],
    is_hit: false,
    is_sale: false,
  },
  {
    slug: "bubu-organizer",
    name_ua: "Органайзер на коляску Bubu",
    name_ru: "Органайзер на коляску Bubu",
    description_ua:
      "Органайзер з кількома кишенями кріпиться на поручень і тримає під рукою телефон, ключі та серветки під час прогулянки. Світловідбивні смужки додають видимості у темний час доби.",
    description_ru:
      "Органайзер с несколькими карманами крепится на поручень и держит под рукой телефон, ключи и салфетки во время прогулки. Светоотражающие полоски добавляют видимости в тёмное время суток.",
    brand: "Bubu",
    category_slug: "accessories-stroller",
    price: 650,
    old_price: null,
    stock_status: "in_stock",
    specs: accessorySpecs("поліестер", "більшість колясок з поручнем", "ручне прання"),
    images: [],
    is_hit: false,
    is_sale: false,
  },
  {
    slug: "bubu-car-seat-adapter-universal",
    name_ua: "Адаптер універсальний для автокрісла Bubu",
    name_ru: "Адаптер универсальный для автокресла Bubu",
    description_ua:
      "Пара адаптерів дозволяє встановити автокрісло групи 0+ на прогулянкове шасі, перетворюючи коляску 2 в 1 на повноцінний комплект 3 в 1. Фіксується клацанням і знімається без інструментів.",
    description_ru:
      "Пара адаптеров позволяет установить автокресло группы 0+ на прогулочное шасси, превращая коляску 2 в 1 в полноценный комплект 3 в 1. Фиксируется щелчком и снимается без инструментов.",
    brand: "Bubu",
    category_slug: "accessories-carseat",
    price: 1200,
    old_price: null,
    stock_status: "in_stock",
    specs: accessorySpecs("армований пластик", "уточнюйте сумісність з моделлю шасі", "протирати сухою тканиною"),
    images: [],
    is_hit: false,
    is_sale: false,
  },
];
