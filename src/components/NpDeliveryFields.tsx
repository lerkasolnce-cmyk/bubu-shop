"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n/shared";
import type { NpCity, NpWarehouse } from "@/lib/np";

export type NpDeliveryLabels = {
  city: string;
  npOffice: string;
  cityNoResults: string;
  officeNoResults: string;
  officeSearchPlaceholder: string;
  loading: string;
};

/**
 * City + warehouse fields backed by the Nova Poshta dictionaries.
 * Degrades to the plain text inputs when the NP API is unreachable, and the
 * warehouse field stays free-text until a city is picked from the dropdown —
 * whatever ends up in the inputs is exactly what the order stores.
 */
export default function NpDeliveryFields({
  locale,
  labels,
  city,
  onCityChange,
  npOffice,
  onNpOfficeChange,
  cityError,
  inputCls,
  errorCls,
}: {
  locale: Locale;
  labels: NpDeliveryLabels;
  city: string;
  onCityChange: (v: string) => void;
  npOffice: string;
  onNpOfficeChange: (v: string) => void;
  cityError?: string;
  inputCls: string;
  errorCls: string;
}) {
  const [apiDown, setApiDown] = useState(false);

  const [cityRef, setCityRef] = useState<string | null>(null);
  const [cityOptions, setCityOptions] = useState<NpCity[]>([]);
  const [cityOpen, setCityOpen] = useState(false);
  const [cityLoading, setCityLoading] = useState(false);
  // Distinguishes "user is typing" from programmatic value updates (option click).
  const cityTyped = useRef(false);

  const [officeOptions, setOfficeOptions] = useState<NpWarehouse[]>([]);
  const [officeOpen, setOfficeOpen] = useState(false);
  const [officeLoading, setOfficeLoading] = useState(false);
  const officeTyped = useRef(false);

  // --- city autocomplete ---------------------------------------------------
  useEffect(() => {
    if (apiDown || !cityTyped.current) return;
    const q = city.trim();
    if (q.length < 2) {
      setCityOptions([]);
      setCityOpen(false);
      return;
    }

    const timer = setTimeout(() => {
      setCityLoading(true);
      fetch(`/api/np/cities?q=${encodeURIComponent(q)}`)
        .then((res) => {
          if (!res.ok) throw new Error("np");
          return res.json();
        })
        .then((data: { cities?: NpCity[] }) => {
          setCityOptions(Array.isArray(data.cities) ? data.cities : []);
          setCityOpen(true);
        })
        .catch(() => setApiDown(true))
        .finally(() => setCityLoading(false));
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, apiDown]);

  function selectCity(option: NpCity) {
    cityTyped.current = false;
    onCityChange(option.present);
    setCityRef(option.hasWarehouses ? option.ref : null);
    onNpOfficeChange("");
    setOfficeOptions([]);
    setCityOpen(false);
  }

  // --- warehouse combobox ----------------------------------------------------
  useEffect(() => {
    if (apiDown || !cityRef || !officeTyped.current) return;

    const timer = setTimeout(() => {
      setOfficeLoading(true);
      fetch(`/api/np/warehouses?cityRef=${cityRef}&q=${encodeURIComponent(npOffice.trim())}`)
        .then((res) => {
          if (!res.ok) throw new Error("np");
          return res.json();
        })
        .then((data: { warehouses?: NpWarehouse[] }) => {
          setOfficeOptions(Array.isArray(data.warehouses) ? data.warehouses : []);
          setOfficeOpen(true);
        })
        .catch(() => setApiDown(true))
        .finally(() => setOfficeLoading(false));
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [npOffice, cityRef, apiDown]);

  function openOfficeList() {
    if (apiDown || !cityRef) return;
    officeTyped.current = true;
    if (officeOptions.length > 0) setOfficeOpen(true);
    else {
      // Trigger the fetch effect even before the user types.
      onNpOfficeChange(npOffice);
      setOfficeLoading(true);
      fetch(`/api/np/warehouses?cityRef=${cityRef}&q=${encodeURIComponent(npOffice.trim())}`)
        .then((res) => {
          if (!res.ok) throw new Error("np");
          return res.json();
        })
        .then((data: { warehouses?: NpWarehouse[] }) => {
          setOfficeOptions(Array.isArray(data.warehouses) ? data.warehouses : []);
          setOfficeOpen(true);
        })
        .catch(() => setApiDown(true))
        .finally(() => setOfficeLoading(false));
    }
  }

  const officeLabel = (w: NpWarehouse) => (locale === "ru" ? w.ru : w.ua);

  const dropdownCls =
    "absolute left-0 right-0 top-full z-20 mt-1 max-h-64 overflow-auto rounded-md border border-blush/60 bg-white shadow-lg";
  const optionCls =
    "block w-full cursor-pointer px-3 py-2 text-left text-sm text-ink hover:bg-blush/20";

  return (
    <>
      <div className="relative">
        <label className="mb-1 block text-sm font-semibold text-ink">{labels.city}</label>
        <input
          type="text"
          value={city}
          onChange={(e) => {
            cityTyped.current = true;
            onCityChange(e.target.value);
            // Manually edited text no longer matches the picked settlement.
            setCityRef(null);
          }}
          onBlur={() => setTimeout(() => setCityOpen(false), 150)}
          className={inputCls}
          autoComplete="off"
        />
        {cityOpen && !apiDown && (
          <div className={dropdownCls}>
            {cityLoading && <p className="px-3 py-2 text-sm text-ink/50">{labels.loading}</p>}
            {!cityLoading && cityOptions.length === 0 && (
              <p className="px-3 py-2 text-sm text-ink/50">{labels.cityNoResults}</p>
            )}
            {!cityLoading &&
              cityOptions.map((option) => (
                <button
                  key={option.ref + option.present}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectCity(option);
                  }}
                  className={optionCls}
                >
                  {option.present}
                </button>
              ))}
          </div>
        )}
        {cityError && <p className={errorCls}>{cityError}</p>}
      </div>

      <div className="relative">
        <label className="mb-1 block text-sm font-semibold text-ink">{labels.npOffice}</label>
        <input
          type="text"
          value={npOffice}
          placeholder={cityRef && !apiDown ? labels.officeSearchPlaceholder : undefined}
          onChange={(e) => {
            officeTyped.current = true;
            onNpOfficeChange(e.target.value);
          }}
          onFocus={openOfficeList}
          onBlur={() => setTimeout(() => setOfficeOpen(false), 150)}
          className={inputCls}
          autoComplete="off"
        />
        {officeOpen && !apiDown && cityRef && (
          <div className={dropdownCls}>
            {officeLoading && <p className="px-3 py-2 text-sm text-ink/50">{labels.loading}</p>}
            {!officeLoading && officeOptions.length === 0 && (
              <p className="px-3 py-2 text-sm text-ink/50">{labels.officeNoResults}</p>
            )}
            {!officeLoading &&
              officeOptions.map((w) => (
                <button
                  key={w.ua}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    officeTyped.current = false;
                    onNpOfficeChange(officeLabel(w));
                    setOfficeOpen(false);
                  }}
                  className={optionCls}
                >
                  {officeLabel(w)}
                </button>
              ))}
          </div>
        )}
      </div>
    </>
  );
}
