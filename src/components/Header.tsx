import Link from "next/link";
import { getLocale, getT } from "@/lib/i18n";
import { categoryName } from "@/lib/categories-i18n";
import { createServerClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";
import { demoCategories, isDemoMode } from "@/lib/demo";
import { telHref } from "@/lib/format";
import LangSwitch from "./LangSwitch";
import CartBadge from "./CartBadge";
import MobileMenu from "./MobileMenu";
import InstallApp from "./InstallApp";

async function getAllCategories(): Promise<Category[]> {
  // Supabase project may not exist yet (no env) — demo data for design preview.
  if (isDemoMode()) return demoCategories;

  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from("categories")
      .select("*")
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
  const allCategories = await getAllCategories();
  const categories = allCategories.filter((c) => c.parent_id === null);
  const childrenByParent = new Map<string, Category[]>();
  for (const c of allCategories) {
    if (!c.parent_id) continue;
    const list = childrenByParent.get(c.parent_id) ?? [];
    list.push(c);
    childrenByParent.set(c.parent_id, list);
  }
  const phone = t("header.phone");
  const phoneHref = telHref(phone);

  const navLinks = [
    { href: "/sale", label: t("nav.sale") },
    { href: "/delivery", label: t("nav.delivery") },
    { href: "/about", label: t("nav.about") },
    { href: "/contacts", label: t("nav.contacts") },
  ];

  const categoryLinks = categories.map((cat) => ({
    href: `/catalog/${cat.slug}`,
    label: categoryName(cat, locale),
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

        {/* Десктоп: кнопка установки PWA — рендерится только когда браузер
            реально умеет ставить (Chrome/Edge прислали beforeinstallprompt). */}
        <InstallApp variant="header" label={t("install.app")} iosHint={t("install.ios")} />

        {/* На телефоне переключатель языков живёт внутри мобильного меню —
            в строке шапки он отъедал место у поиска (сжимался до нуля). */}
        <div className="hidden md:block">
          <LangSwitch locale={locale} />
        </div>

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
          locale={locale}
          categories={categoryLinks}
          navLinks={navLinks}
          menuLabel={t("header.menu")}
          closeLabel={t("header.close")}
          installLabel={t("install.app")}
          installHint={t("install.ios")}
        />
      </div>

      {categories.length > 0 && (
        <div className="hidden border-t border-blush/40 md:block">
          {/* Desktop (lg+): one row, spread edge-to-edge (flex-nowrap + justify-between).
              Tablet (md): wraps to keep every chip visible. No overflow container, so the
              pure-CSS dropdowns (group-hover/focus-within) are never clipped. */}
          <div className="mx-auto flex max-w-6xl flex-wrap gap-x-1.5 gap-y-1 px-4 py-2 lg:flex-nowrap lg:justify-between lg:gap-x-0.5">
            {categories.map((root, i) => {
              const kids = childrenByParent.get(root.id) ?? [];
              const alignRight = i >= categories.length - 2;
              return (
                <div key={root.id} className="group relative">
                  <Link
                    href={`/catalog/${root.slug}`}
                    className="inline-block whitespace-nowrap rounded-full bg-mint/40 px-2.5 py-1 text-[13px] font-medium text-ink transition group-hover:bg-mint lg:px-1.5 lg:text-xs"
                  >
                    {categoryName(root, locale)}
                  </Link>
                  {kids.length > 0 && (
                    <div
                      className={`invisible absolute top-full z-50 pt-1 opacity-0 transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 ${
                        alignRight ? "right-0" : "left-0"
                      }`}
                    >
                      <div className="min-w-52 rounded-xl border border-blush/40 bg-white p-2 shadow-lg">
                        {kids.map((kid) => (
                          <Link
                            key={kid.id}
                            href={`/catalog/${kid.slug}`}
                            className="block whitespace-nowrap rounded-lg px-3 py-1.5 text-sm text-ink/80 hover:bg-blush/20 hover:text-ink"
                          >
                            {categoryName(kid, locale)}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
