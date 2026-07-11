import Link from "next/link";
import { getLocale, getT, pick } from "@/lib/i18n";
import { createServerClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";
import { demoCategories, isDemoMode } from "@/lib/demo";
import { telHref } from "@/lib/format";
import LangSwitch from "./LangSwitch";
import CartBadge from "./CartBadge";
import MobileMenu from "./MobileMenu";

async function getRootCategories(): Promise<Category[]> {
  // Supabase project may not exist yet (no env) — demo data for design preview.
  if (isDemoMode()) return demoCategories;

  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .is("parent_id", null)
      .order("sort", { ascending: true });

    if (error || !data) return [];
    return data as Category[];
  } catch {
    return [];
  }
}

export default async function Header() {
  const locale = await getLocale();
  const t = getT(locale);
  const categories = await getRootCategories();
  const phone = t("header.phone");
  const phoneHref = telHref(phone);

  const navLinks = [
    { href: "/delivery", label: t("nav.delivery") },
    { href: "/about", label: t("nav.about") },
    { href: "/contacts", label: t("nav.contacts") },
  ];

  const categoryLinks = categories.map((cat) => ({
    href: `/catalog/${cat.slug}`,
    label: pick(cat, "name", locale),
  }));

  return (
    <header className="sticky top-0 z-40 border-b border-blush/60 bg-cream/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
        <Link
          href="/"
          className="shrink-0 rounded-full bg-blush px-4 py-2 text-lg font-extrabold lowercase tracking-tight text-ink"
        >
          bu-bu
        </Link>

        <form action="/search" method="GET" className="min-w-0 flex-1">
          <input
            type="search"
            name="q"
            placeholder={t("header.search")}
            className="w-full rounded-full border border-mint bg-mint/30 px-4 py-2 text-sm text-ink placeholder:text-ink/50 focus:border-accent focus:outline-none"
          />
        </form>

        {phoneHref ? (
          <a
            href={phoneHref}
            className="hidden shrink-0 text-sm font-semibold text-ink/80 hover:text-ink lg:block"
          >
            {phone}
          </a>
        ) : (
          <span className="hidden shrink-0 text-sm font-semibold text-ink/80 lg:block">{phone}</span>
        )}

        <LangSwitch locale={locale} />

        <Link
          href="/cart"
          aria-label={t("header.cart")}
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-blush/40"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 4h2l1.4 10.5a2 2 0 0 0 2 1.5h8.4a2 2 0 0 0 2-1.6L20 8H6"
            />
            <circle cx="9" cy="20" r="1.4" />
            <circle cx="17" cy="20" r="1.4" />
          </svg>
          <CartBadge />
        </Link>

        <MobileMenu
          categories={categoryLinks}
          navLinks={navLinks}
          menuLabel={t("header.menu")}
          closeLabel={t("header.close")}
        />
      </div>

      {categoryLinks.length > 0 && (
        <div className="hidden border-t border-blush/40 md:block">
          <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 py-2">
            {categoryLinks.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="shrink-0 rounded-full bg-mint/40 px-3 py-1 text-sm font-medium text-ink hover:bg-mint"
              >
                {cat.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
