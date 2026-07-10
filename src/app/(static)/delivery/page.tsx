import type { Metadata } from "next";
import { getLocale, getT } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = getT(locale);
  return {
    title: t("seo.delivery.title"),
    description: t("seo.delivery.description"),
  };
}

export default async function DeliveryPage() {
  const locale = await getLocale();
  const t = getT(locale);

  const deliveryCards = [
    { title: t("static.delivery.npTitle"), text: t("static.delivery.npText") },
    { title: t("static.delivery.pickupTitle"), text: t("static.delivery.pickupText") },
  ];

  const paymentCards = [
    { title: t("static.delivery.monoTitle"), text: t("static.delivery.monoText") },
    { title: t("static.delivery.codTitle"), text: t("static.delivery.codText") },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">{t("static.delivery.title")}</h1>
      <p className="mt-3 text-ink/70">{t("static.delivery.intro")}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {deliveryCards.map((card) => (
          <div key={card.title} className="rounded-lg border border-blush/40 bg-white p-5">
            <h2 className="text-lg font-bold text-ink">{card.title}</h2>
            <p className="mt-2 text-sm text-ink/70">{card.text}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-xl font-extrabold text-ink">{t("static.delivery.paymentTitle")}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {paymentCards.map((card) => (
          <div key={card.title} className="rounded-lg border border-mint/60 bg-mint/20 p-5">
            <h3 className="text-lg font-bold text-ink">{card.title}</h3>
            <p className="mt-2 text-sm text-ink/70">{card.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
