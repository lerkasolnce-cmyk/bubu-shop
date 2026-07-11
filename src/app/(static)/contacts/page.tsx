import type { Metadata } from "next";
import { getLocale, getT } from "@/lib/i18n";
import { telHref } from "@/lib/format";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getT(locale);
  return {
    title: t("seo.contacts.title"),
    description: t("seo.contacts.description"),
  };
}

export default async function ContactsPage() {
  const locale = await getLocale();
  const t = getT(locale);
  const phone = t("header.phone");
  const phoneHref = telHref(phone);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">{t("static.contacts.title")}</h1>
      <p className="mt-3 text-ink/70">{t("static.contacts.intro")}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-blush/40 bg-white p-5 text-center">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink/50">
            {t("static.contacts.phoneTitle")}
          </h2>
          {phoneHref ? (
            <a href={phoneHref} className="mt-2 block text-lg font-bold text-ink hover:text-accent">
              {phone}
            </a>
          ) : (
            <p className="mt-2 text-lg font-bold text-ink">{phone}</p>
          )}
        </div>

        <div className="rounded-lg border border-blush/40 bg-white p-5 text-center">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink/50">
            {t("static.contacts.cityTitle")}
          </h2>
          <p className="mt-2 text-lg font-bold text-ink">{t("static.contacts.cityValue")}</p>
        </div>

        <div className="rounded-lg border border-mint/60 bg-mint/20 p-5 text-center">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink/50">
            {t("static.contacts.instagramTitle")}
          </h2>
          <a
            href="https://www.instagram.com/bubu_odessa/"
            target="_blank"
            rel="noreferrer noopener"
            className="mt-2 inline-flex items-center gap-1.5 text-sm font-bold text-accent hover:opacity-80"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.9" fill="currentColor" stroke="none" />
            </svg>
            {t("static.contacts.instagramCta")}
          </a>
        </div>
      </div>
    </div>
  );
}
