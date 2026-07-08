"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type FiltersInitial = {
  brands: string[];
  minPrice?: number;
  maxPrice?: number;
  inStockOnly: boolean;
};

export type FiltersLabels = {
  filters: string;
  brand: string;
  price: string;
  priceFrom: string;
  priceTo: string;
  inStockOnly: string;
  apply: string;
  reset: string;
};

export default function Filters({
  brands,
  initial,
  basePath,
  labels,
}: {
  brands: string[];
  initial: FiltersInitial;
  basePath: string;
  labels: FiltersLabels;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const spKey = searchParams.toString();

  const [open, setOpen] = useState(false);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(initial.brands);
  const [min, setMin] = useState(initial.minPrice != null ? String(initial.minPrice) : "");
  const [max, setMax] = useState(initial.maxPrice != null ? String(initial.maxPrice) : "");
  const [inStockOnly, setInStockOnly] = useState(initial.inStockOnly);

  // Re-sync local edit state whenever the URL changes underneath us (apply, reset, back button).
  useEffect(() => {
    const brandParam = searchParams.get("brand");
    setSelectedBrands(brandParam ? brandParam.split(",").map((b) => b.trim().toLowerCase()).filter(Boolean) : []);
    setMin(searchParams.get("min") ?? "");
    setMax(searchParams.get("max") ?? "");
    setInStockOnly(searchParams.get("stock") === "1");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spKey]);

  // URL carries lowercase brand values (?brand=anex,cybex); labels keep DB casing.
  function toggleBrand(brand: string) {
    const key = brand.toLowerCase();
    setSelectedBrands((prev) => (prev.includes(key) ? prev.filter((b) => b !== key) : [...prev, key]));
  }

  function apply() {
    const params = new URLSearchParams(searchParams.toString());
    if (selectedBrands.length > 0) params.set("brand", selectedBrands.join(","));
    else params.delete("brand");
    if (min) params.set("min", min);
    else params.delete("min");
    if (max) params.set("max", max);
    else params.delete("max");
    if (inStockOnly) params.set("stock", "1");
    else params.delete("stock");
    params.delete("page");
    setOpen(false);
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  function reset() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("brand");
    params.delete("min");
    params.delete("max");
    params.delete("stock");
    params.delete("page");
    setOpen(false);
    const qs = params.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  const inputCls =
    "w-full min-w-0 rounded-md border border-blush/60 bg-cream px-2 py-1.5 text-sm text-ink placeholder:text-ink/40 focus:border-accent focus:outline-none";

  const panel = (
    <div className="flex flex-col gap-5 rounded-lg border border-blush/40 bg-white p-4">
      {brands.length > 0 && (
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-bold text-ink">{labels.brand}</h3>
          <div className="flex max-h-48 flex-col gap-1.5 overflow-y-auto">
            {brands.map((brand) => (
              <label key={brand} className="flex items-center gap-2 text-sm text-ink/80">
                <input
                  type="checkbox"
                  className="h-4 w-4 shrink-0 rounded border-blush accent-accent"
                  checked={selectedBrands.includes(brand.toLowerCase())}
                  onChange={() => toggleBrand(brand)}
                />
                {brand}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-bold text-ink">{labels.price}</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder={labels.priceFrom}
            value={min}
            onChange={(e) => setMin(e.target.value)}
            className={inputCls}
          />
          <span className="shrink-0 text-ink/40">–</span>
          <input
            type="number"
            min={0}
            inputMode="numeric"
            placeholder={labels.priceTo}
            value={max}
            onChange={(e) => setMax(e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink/80">
        <input
          type="checkbox"
          className="h-4 w-4 shrink-0 rounded border-blush accent-accent"
          checked={inStockOnly}
          onChange={(e) => setInStockOnly(e.target.checked)}
        />
        {labels.inStockOnly}
      </label>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={apply}
          className="rounded-full bg-accent px-4 py-2 text-sm font-bold text-cream transition hover:opacity-90"
        >
          {labels.apply}
        </button>
        <button
          type="button"
          onClick={reset}
          className="text-center text-sm font-medium text-ink/60 underline-offset-2 hover:underline"
        >
          {labels.reset}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full rounded-full border border-blush/60 bg-white px-4 py-2 text-sm font-semibold text-ink lg:hidden"
      >
        {labels.filters}
      </button>
      <div className={open ? "block lg:block" : "hidden lg:block"}>{panel}</div>
    </div>
  );
}
