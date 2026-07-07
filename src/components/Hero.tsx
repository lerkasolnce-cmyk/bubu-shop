import Link from "next/link";

export default function Hero({ t }: { t: (key: string) => string }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-cream to-blush">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-mint/40 blur-2xl" />
        <div className="absolute -right-16 top-6 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute -bottom-12 left-1/3 h-32 w-32 rounded-full bg-blush/70 blur-2xl" />
        <div className="absolute bottom-4 right-1/4 h-20 w-20 rounded-full bg-mint/30 blur-xl" />
      </div>

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
