import Link from "next/link";
import Reveal from "./Reveal";

type CategoryCard = { slug: string; name: string; count: number };

function pluralKey(n: number): "One" | "Few" | "Many" {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "One";
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return "Few";
  return "Many";
}

function CategoryIcon({ slug }: { slug: string }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: "h-7 w-7",
  };

  switch (slug) {
    case "strollers":
    case "strollers-2in1":
      return (
        <svg {...common}>
          <path d="M5 11c0-4 3-7 7-7 3.5 0 6 2 6.8 5" />
          <path d="M4 11h16l-1.4 4.2A2.5 2.5 0 0 1 16.2 17H8.8a2.5 2.5 0 0 1-2.4-1.8L5 11Z" />
          <circle cx="9" cy="20" r="1.6" />
          <circle cx="16" cy="20" r="1.6" />
        </svg>
      );
    case "strollers-3in1":
      return (
        <svg {...common}>
          <path d="M4 12c0-3 2.5-5 5-5h6c2.5 0 5 2 5 5" />
          <path d="M3 12h18l-1.5 3.5A3 3 0 0 1 16.7 17H7.3a3 3 0 0 1-2.8-1.5L3 12Z" />
          <circle cx="8.5" cy="20" r="1.4" />
          <circle cx="15.5" cy="20" r="1.4" />
        </svg>
      );
    case "strollers-buggy":
      return (
        <svg {...common}>
          <path d="M6 5l1 3" />
          <path d="M7 8h9l3 6" />
          <path d="M7 8c-1.5 3-1.5 7 1 10" />
          <circle cx="9" cy="19" r="1.5" />
          <circle cx="18" cy="16" r="1.5" />
        </svg>
      );
    case "car-seats":
      return (
        <svg {...common}>
          <path d="M8 4c0 3 0 5 1.5 6.5S13 12 13 15v3" />
          <path d="M6 21v-4a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v4" />
          <path d="M6 21h13" />
        </svg>
      );
    case "accessories":
      return (
        <svg {...common}>
          <path d="M8 8V6a4 4 0 0 1 8 0v2" />
          <rect x="4.5" y="8" width="15" height="12" rx="3" />
          <path d="M9 12a3 3 0 0 0 6 0" />
        </svg>
      );
    case "nursery":
      return (
        <svg {...common}>
          <path d="M4 20V9a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v11" />
          <path d="M4 15h16" />
          <path d="M7 7V4M17 7V4" />
        </svg>
      );
    case "highchairs":
      return (
        <svg {...common}>
          <path d="M7 4h9l-1 7H8L7 4Z" />
          <path d="M7.5 11 6 20M15.5 11 17 20" />
          <path d="M6.5 15.5h11" />
        </svg>
      );
    case "kids-transport":
      return (
        <svg {...common}>
          <circle cx="6" cy="17" r="3" />
          <circle cx="18" cy="17" r="3" />
          <path d="M6 17 9 8h3l3 4h4" />
          <path d="M9 8 8 6H6" />
        </svg>
      );
    case "feeding":
      return (
        <svg {...common}>
          <path d="M9 3h4v4H9z" />
          <path d="M8 7h6l1 3v9a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-9l1-3Z" />
          <path d="M8 13h6" />
        </svg>
      );
    case "hygiene":
      return (
        <svg {...common}>
          <path d="M12 3c2 2.5 4 5 4 8a4 4 0 0 1-8 0c0-3 2-5.5 4-8Z" />
          <path d="M5 19c0-1.5 1-3 3-3h8c2 0 3 1.5 3 3" />
          <path d="M4 21h16" />
        </svg>
      );
    case "toys":
      return (
        <svg {...common}>
          <circle cx="9" cy="9" r="4" />
          <circle cx="16" cy="14" r="4" />
          <path d="M11.5 11.5 13.5 13.5" />
        </svg>
      );
    case "clothing":
      return (
        <svg {...common}>
          <path d="M9 4 5 6.5 6.5 9 8 8v11h8V8l1.5 1L19 6.5 15 4a3 3 0 0 1-6 0Z" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}

// Soft pastel tile tints, cycled per card so the grid reads as a warm, colourful
// set rather than flat white boxes. Each is a gentle two-stop gradient on-brand.
const TILE_TINTS = [
  "from-[#F7DBDB] to-[#FCEEEA]", // blush
  "from-[#CFE9DE] to-[#EAF6F1]", // mint
  "from-[#F7DDCB] to-[#FCEFE6]", // peach
  "from-[#E5DEF2] to-[#F2EDFA]", // lavender
  "from-[#F4E9C7] to-[#FBF5E1]", // butter
];

export default function CategoryGrid({
  categories,
  t,
  variant = "reveal",
}: {
  categories: CategoryCard[];
  t: (key: string) => string;
  // "reveal": per-card IntersectionObserver reveal (default). "plain": bare cards
  // (e.g. when a parent drives their animation).
  variant?: "reveal" | "plain";
}) {
  if (categories.length === 0) return null;

  const cards = categories.map((cat, i) => {
    const tint = TILE_TINTS[i % TILE_TINTS.length];
    const card = (
      <Link
        href={`/catalog/${cat.slug}`}
        className={`group flex h-full flex-col items-center justify-center gap-3 rounded-3xl bg-gradient-to-br ${tint} p-5 text-center shadow-sm ring-1 ring-black/[0.04] transition duration-200 hover:-translate-y-1 hover:shadow-md sm:p-6`}
      >
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/70 text-ink shadow-sm transition group-hover:scale-105 sm:h-[72px] sm:w-[72px]">
          <CategoryIcon slug={cat.slug} />
        </span>
        <span className="text-sm font-bold leading-tight text-ink sm:text-base">{cat.name}</span>
        {cat.count > 0 ? (
          <span className="rounded-full bg-white/60 px-2.5 py-0.5 text-xs font-medium text-ink/60">
            {cat.count} {t(`category.products${pluralKey(cat.count)}`)}
          </span>
        ) : (
          <span className="text-xs font-medium text-ink/40">{t("category.comingSoon")}</span>
        )}
      </Link>
    );

    return variant === "plain" ? (
      <div key={cat.slug} data-hero-card className="h-full">
        {card}
      </div>
    ) : (
      <Reveal key={cat.slug} delay={i * 50} className="h-full">
        {card}
      </Reveal>
    );
  });

  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5">{cards}</div>;
}
