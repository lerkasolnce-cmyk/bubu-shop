import Link from "next/link";
import { getLocale, getT } from "@/lib/i18n";

export default async function Footer() {
  const locale = await getLocale();
  const t = getT(locale);

  return (
    <footer className="mt-auto border-t border-blush/60 bg-cream">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="inline-block rounded-full bg-blush px-4 py-2 text-lg font-extrabold lowercase tracking-tight text-ink">
            bu-bu
          </span>
          <p className="mt-3 text-sm text-ink/70">{t("header.phone")}</p>
          <p className="mt-1 text-sm text-ink/70">{t("footer.followUs")}</p>
          <a
            href="https://www.instagram.com/bubu_odessa/"
            target="_blank"
            rel="noreferrer noopener"
            className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:opacity-80"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="3" width="18" height="18" rx="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.9" fill="currentColor" stroke="none" />
            </svg>
            @bubu_odessa
          </a>
        </div>

        <nav className="flex flex-col gap-2 text-sm font-semibold text-ink/80 sm:flex-row sm:gap-6">
          <Link href="/delivery" className="hover:text-ink">
            {t("nav.delivery")}
          </Link>
          <Link href="/about" className="hover:text-ink">
            {t("nav.about")}
          </Link>
          <Link href="/contacts" className="hover:text-ink">
            {t("nav.contacts")}
          </Link>
        </nav>
      </div>

      <div className="border-t border-blush/40 px-4 py-4 text-center text-xs text-ink/50">
        &copy; {new Date().getFullYear()} bu-bu. {t("footer.rights")}
      </div>
    </footer>
  );
}
