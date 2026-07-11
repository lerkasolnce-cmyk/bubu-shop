"use client";

import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";

const OPTIONS: { locale: Locale; label: string }[] = [
  { locale: "ua", label: "UA" },
  { locale: "ru", label: "RU" },
  { locale: "it", label: "IT" },
  { locale: "en", label: "EN" },
];

export default function LangSwitch({ locale }: { locale: Locale }) {
  const router = useRouter();

  async function setLocale(next: Locale) {
    if (next === locale) return;
    await fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: next }),
    });
    router.refresh();
  }

  return (
    <div className="flex shrink-0 items-center gap-1 text-sm font-bold">
      {OPTIONS.map((opt, i) => (
        <span key={opt.locale} className="flex items-center gap-1">
          {i > 0 && <span className="text-ink/30">/</span>}
          <button
            type="button"
            onClick={() => setLocale(opt.locale)}
            aria-current={locale === opt.locale}
            className={locale === opt.locale ? "text-ink" : "text-ink/40 hover:text-ink/70"}
          >
            {opt.label}
          </button>
        </span>
      ))}
    </div>
  );
}
