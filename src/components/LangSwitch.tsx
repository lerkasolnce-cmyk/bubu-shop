"use client";

import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";

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
      <button
        type="button"
        onClick={() => setLocale("ua")}
        aria-current={locale === "ua"}
        className={locale === "ua" ? "text-ink" : "text-ink/40 hover:text-ink/70"}
      >
        UA
      </button>
      <span className="text-ink/30">/</span>
      <button
        type="button"
        onClick={() => setLocale("ru")}
        aria-current={locale === "ru"}
        className={locale === "ru" ? "text-ink" : "text-ink/40 hover:text-ink/70"}
      >
        RU
      </button>
    </div>
  );
}
