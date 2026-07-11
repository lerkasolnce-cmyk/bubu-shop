/** Formats an ISO timestamp as `dd.mm.yyyy hh:mm` (admin order views). */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Derives a tel: href from the display phone in the dict, so the link can never
 * drift from the visible number. Returns null while the dict still holds the
 * `+380 __ ___ __ __` placeholder (underscores / too few digits) — the phone
 * then renders as plain text without a broken tel: link.
 */
export function telHref(displayPhone: string): string | null {
  if (displayPhone.includes("_")) return null;
  const compact = displayPhone.replace(/[\s()-]/g, "");
  const digits = compact.replace(/\D/g, "");
  if (digits.length < 10) return null;
  return `tel:${compact}`;
}
