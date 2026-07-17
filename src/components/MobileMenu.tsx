"use client";

import { useState } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/shared";
import InstallApp from "./InstallApp";
import LangSwitch from "./LangSwitch";

interface MenuLink {
  href: string;
  label: string;
}

export default function MobileMenu({
  locale,
  categories,
  navLinks,
  menuLabel,
  closeLabel,
  installLabel,
  installHint,
}: {
  locale: Locale;
  categories: MenuLink[];
  navLinks: MenuLink[];
  menuLabel: string;
  closeLabel: string;
  installLabel: string;
  installHint: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? closeLabel : menuLabel}
        aria-expanded={open}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-mint/50 hover:bg-mint"
      >
        {open ? (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {open && (
        <nav className="fixed inset-x-0 top-16 z-50 flex max-h-[75vh] flex-col gap-1 overflow-y-auto border-t border-blush/40 bg-cream px-4 py-3 shadow-lg">
          {/* Языки — тут, а не в строке шапки: на телефоне им там не хватает места. */}
          <div className="mb-1 flex justify-center border-b border-blush/40 pb-2">
            <LangSwitch locale={locale} />
          </div>
          {categories.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              onClick={() => setOpen(false)}
              className="rounded-full bg-mint/40 px-4 py-2 text-sm font-medium text-ink"
            >
              {c.label}
            </Link>
          ))}
          {categories.length > 0 && navLinks.length > 0 && (
            <div className="my-1 border-t border-blush/40" />
          )}
          {navLinks.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-ink"
            >
              {n.label}
            </Link>
          ))}
          <InstallApp label={installLabel} iosHint={installHint} />
        </nav>
      )}
    </div>
  );
}
