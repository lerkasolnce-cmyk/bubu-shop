import type { Metadata } from "next";
import { getLocale, getT } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getT(locale);
  return {
    title: t("seo.about.title"),
    description: t("seo.about.description"),
  };
}

const BRANDS = ["Anex", "Cybex", "Espiro"];

export default async function AboutPage() {
  const locale = await getLocale();
  const t = getT(locale);

  const whyCards = [
    { title: t("static.about.whyVerifiedTitle"), text: t("static.about.whyVerifiedText") },
    { title: t("static.about.whyWarrantyTitle"), text: t("static.about.whyWarrantyText") },
    { title: t("static.about.whyConsultTitle"), text: t("static.about.whyConsultText") },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">{t("static.about.title")}</h1>
      <p className="mt-3 text-ink/70">{t("static.about.intro")}</p>

      <section className="mt-8 rounded-lg border border-blush/40 bg-white p-5">
        <h2 className="text-lg font-bold text-ink">{t("static.about.brandsTitle")}</h2>
        <p className="mt-2 text-sm text-ink/70">{t("static.about.brandsText")}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          {BRANDS.map((brand) => (
            <span
              key={brand}
              className="rounded-full bg-mint/40 px-4 py-1.5 text-sm font-extrabold uppercase tracking-wide text-ink/70"
            >
              {brand}
            </span>
          ))}
        </div>
      </section>

      <h2 className="mt-10 text-xl font-extrabold text-ink">{t("static.about.whyTitle")}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {whyCards.map((card) => (
          <div key={card.title} className="rounded-lg border border-mint/60 bg-mint/20 p-5">
            <h3 className="text-base font-bold text-ink">{card.title}</h3>
            <p className="mt-2 text-sm text-ink/70">{card.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
