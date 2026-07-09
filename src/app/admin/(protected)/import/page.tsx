import { getLocale, getT } from "@/lib/i18n";

export default async function AdminImportPage() {
  const t = getT(await getLocale());
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold text-ink">{t("admin.nav.import")}</h1>
      <p className="text-sm text-ink/60">{t("admin.comingSoon")}</p>
    </div>
  );
}
