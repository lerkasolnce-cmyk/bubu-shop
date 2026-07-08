import Link from "next/link";
import { getLocale, getT } from "@/lib/i18n";

export default async function OrderThanksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getLocale();
  const t = getT(locale);

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-4 px-4 py-16 text-center">
      <p className="text-5xl">🎉</p>
      <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">{t("order.thanksTitle")}</h1>
      <p className="text-base font-semibold text-ink/80">
        {t("order.thanksNumber")} №{id}
      </p>
      <p className="text-ink/70">{t("order.thanksText")}</p>

      <div className="mt-4 flex flex-col items-center gap-3">
        <Link
          href="/"
          className="rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-cream transition hover:opacity-90"
        >
          {t("order.backHome")}
        </Link>
        <a
          href="https://www.instagram.com/bubu_odessa/"
          target="_blank"
          rel="noreferrer noopener"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:opacity-80"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="0.9" fill="currentColor" stroke="none" />
          </svg>
          @bubu_odessa
        </a>
      </div>
    </div>
  );
}
