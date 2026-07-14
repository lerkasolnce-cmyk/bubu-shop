import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { __clearCache, discountPercent, formatPrice, getEurRate, uahToEur } from "@/lib/currency";

const ORIGINAL_FALLBACK = process.env.EUR_UAH_FALLBACK_RATE;

beforeEach(() => {
  __clearCache();
  vi.unstubAllGlobals();
});

afterEach(() => {
  __clearCache();
  vi.unstubAllGlobals();
  vi.useRealTimers();
  if (ORIGINAL_FALLBACK === undefined) delete process.env.EUR_UAH_FALLBACK_RATE;
  else process.env.EUR_UAH_FALLBACK_RATE = ORIGINAL_FALLBACK;
});

describe("uahToEur", () => {
  it("converts and rounds to 2 decimals", () => {
    expect(uahToEur(1000, 48)).toBeCloseTo(20.83, 5);
  });

  it("rounds the classic .005 boundary correctly (avoids float truncation)", () => {
    // Math.round(1.005 * 100) / 100 naively yields 1 (not 1.01) due to fp error —
    // uahToEur must compensate so this rounds up as expected.
    expect(uahToEur(1.005, 1)).toBe(1.01);
  });

  it("rounds down when the third decimal is below 5", () => {
    expect(uahToEur(1.004, 1)).toBe(1);
  });
});

describe("formatPrice", () => {
  it("formats UAH for locale 'ua' with the ₴ prefix and uk-UA grouping", () => {
    expect(formatPrice(39000, "ua")).toBe("₴39 000");
  });

  it("formats UAH for locale 'ru'", () => {
    expect(formatPrice(39000, "ru")).toBe("₴39 000");
  });

  it("formats UAH for locale 'en' (only 'it' ever shows EUR)", () => {
    expect(formatPrice(39000, "en")).toBe("₴39 000");
  });

  it("formats EUR for locale 'it' when a rate is supplied", () => {
    expect(formatPrice(39000, "it", 48)).toBe("€812,50");
  });

  it("falls back to UAH for locale 'it' when no rate is supplied", () => {
    expect(formatPrice(39000, "it")).toBe("₴39 000");
  });
});

describe("discountPercent", () => {
  it("computes the rounded percentage off when old_price is higher", () => {
    expect(discountPercent(750, 1000)).toBe(25);
  });

  it("returns null when there's no old price", () => {
    expect(discountPercent(750, null)).toBeNull();
    expect(discountPercent(750, undefined)).toBeNull();
  });

  it("returns null when old_price is equal to price", () => {
    expect(discountPercent(1000, 1000)).toBeNull();
  });

  it("returns null when old_price is lower than price (bad data)", () => {
    expect(discountPercent(1000, 750)).toBeNull();
  });
});

describe("getEurRate", () => {
  it("returns the NBU rate on a successful response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [{ r030: 978, txt: "Euro", rate: 47.9012, cc: "EUR", exchangedate: "11.07.2026" }],
      })
    );

    await expect(getEurRate()).resolves.toBe(47.9012);
  });

  it("falls back to EUR_UAH_FALLBACK_RATE when fetch rejects", async () => {
    process.env.EUR_UAH_FALLBACK_RATE = "42";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down"))
    );

    await expect(getEurRate()).resolves.toBe(42);
  });

  it("falls back to EUR_UAH_FALLBACK_RATE when the response is not ok", async () => {
    process.env.EUR_UAH_FALLBACK_RATE = "42";
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => [] }));

    await expect(getEurRate()).resolves.toBe(42);
  });

  it("falls back to 48 when EUR_UAH_FALLBACK_RATE is unset and fetch fails", async () => {
    delete process.env.EUR_UAH_FALLBACK_RATE;
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    await expect(getEurRate()).resolves.toBe(48);
  });

  it("aborts and falls back after the 5s timeout", async () => {
    process.env.EUR_UAH_FALLBACK_RATE = "42";
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation((_url: string, opts: { signal: AbortSignal }) => {
        return new Promise((_resolve, reject) => {
          opts.signal.addEventListener("abort", () => {
            const err = new Error("The operation was aborted.");
            err.name = "AbortError";
            reject(err);
          });
        });
      })
    );

    const pending = getEurRate();
    await vi.advanceTimersByTimeAsync(5000);
    await expect(pending).resolves.toBe(42);
  });

  it("caches a successful rate for subsequent calls within the TTL", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [{ rate: 47.5 }],
    });
    vi.stubGlobal("fetch", fetchMock);

    await getEurRate();
    await getEurRate();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("never throws even if fetch itself throws synchronously", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => {
        throw new Error("boom");
      })
    );

    await expect(getEurRate()).resolves.not.toThrow();
  });
});
