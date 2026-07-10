import Link from "next/link";
import HeroParallax from "./HeroParallax";

export default function Hero({ t }: { t: (key: string) => string }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-cream to-blush">
      <HeroParallax />

      <div className="relative mx-auto max-w-6xl px-4 py-16 text-center sm:py-24">
        <h1 className="mx-auto max-w-2xl text-3xl font-extrabold leading-tight text-ink sm:text-5xl">
          {t("hero.title")}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-ink/70 sm:text-lg">{t("hero.subtitle")}</p>
        <Link
          href="/catalog/strollers-2in1"
          className="mt-8 inline-block rounded-full bg-accent px-8 py-3 text-base font-bold text-cream shadow-sm transition hover:opacity-90"
        >
          {t("hero.cta")}
        </Link>
      </div>
    </section>
  );
}
