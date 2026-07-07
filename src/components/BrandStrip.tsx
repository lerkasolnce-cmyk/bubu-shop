const BRANDS = ["Anex", "Cybex", "Espiro"];

export default function BrandStrip() {
  return (
    <section className="mx-auto w-full max-w-6xl px-4">
      <div className="flex flex-wrap items-center justify-center gap-4 rounded-lg bg-mint/20 py-6">
        {BRANDS.map((brand) => (
          <span
            key={brand}
            className="rounded-full bg-white px-6 py-2 text-lg font-extrabold uppercase tracking-wide text-ink/70"
          >
            {brand}
          </span>
        ))}
      </div>
    </section>
  );
}
