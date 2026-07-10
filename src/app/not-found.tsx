import Link from "next/link";
import type { Metadata } from "next";
import { getLocale, getT } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getT(locale);
  return { title: t("notFound.title") };
}

export default async function NotFound() {
  const locale = await getLocale();
  const t = getT(locale);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <svg viewBox="0 0 64 64" className="h-24 w-24 text-ink/25" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 30c0-10 7-18 16-18 8 0 13 5 15 12" />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M10 30h38l-3 8a6 6 0 0 1-5.7 4H20a6 6 0 0 1-5.8-4.5L12 30Z"
        />
        <circle cx="20" cy="48" r="4" />
        <circle cx="42" cy="48" r="4" />
        <path strokeLinecap="round" d="M45 12l6-4" />
      </svg>

      <h1 className="mt-6 text-2xl font-extrabold text-ink sm:text-3xl">404</h1>
      <p className="mt-2 text-lg font-semibold text-ink">{t("notFound.title")}</p>
      <p className="mt-2 text-ink/70">{t("notFound.text")}</p>

      <Link
        href="/"
        className="mt-6 inline-block rounded-full bg-accent px-6 py-2.5 text-sm font-bold text-cream shadow-sm transition hover:opacity-90"
      >
        {t("notFound.cta")}
      </Link>
    </div>
  );
}
