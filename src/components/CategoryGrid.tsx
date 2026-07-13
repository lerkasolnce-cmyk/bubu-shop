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
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
  }
}

export default function CategoryGrid({
  categories,
  t,
  variant = "reveal",
}: {
  categories: CategoryCard[];
  t: (key: string) => string;
  // "reveal": standalone section with per-card IntersectionObserver reveals.
  // "plain": bare cards tagged data-hero-card — NatureHero drives their drop-in
  // itself, so Reveal's own transitions must not fight it.
  variant?: "reveal" | "plain";
}) {
  if (categories.length === 0) return null;

  const cards = categories.map((cat, i) => {
    const card = (
      <Link
        href={`/catalog/${cat.slug}`}
        className="flex h-full flex-col items-center gap-2 rounded-lg border border-blush/40 bg-white p-4 text-center transition hover:shadow-md"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-mint/40 text-ink">
          <CategoryIcon slug={cat.slug} />
        </span>
        <span className="text-sm font-semibold text-ink">{cat.name}</span>
        <span className="text-xs text-ink/50">
          {cat.count} {t(`category.products${pluralKey(cat.count)}`)}
        </span>
      </Link>
    );

    return variant === "plain" ? (
      <div key={cat.slug} data-hero-card className="h-full">
        {card}
      </div>
    ) : (
      <Reveal key={cat.slug} delay={i * 60} className="h-full">
        {card}
      </Reveal>
    );
  });

  return (
    <section className="mx-auto w-full max-w-6xl px-4">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">{cards}</div>
    </section>
  );
}
