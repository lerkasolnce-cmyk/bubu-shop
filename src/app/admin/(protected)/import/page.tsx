import Link from "next/link";
import { getLocale, getT } from "@/lib/i18n";
import { isDemoMode } from "@/lib/demo";
import ImportPanel, { type ImportPanelLabels } from "@/components/admin/ImportPanel";

export default async function AdminImportPage() {
  const t = getT(await getLocale());

  const labels: ImportPanelLabels = {
    demoNotice: t("admin.import.demoNotice"),
    chooseFile: t("admin.import.chooseFile"),
    previewTitle: t("admin.import.previewTitle"),
    validRows: t("admin.import.validRows"),
    errorsTitle: t("admin.import.errorsTitle"),
    colSlug: t("admin.import.colSlug"),
    colName: t("admin.import.colName"),
    colBrand: t("admin.import.colBrand"),
    colCategory: t("admin.import.colCategory"),
    colPrice: t("admin.import.colPrice"),
    colStock: t("admin.import.colStock"),
    stockInStock: t("product.inStock"),
    stockPreorder: t("product.preorder"),
    stockOutOfStock: t("product.outOfStock"),
    importButton: t("admin.import.importButton"),
    importing: t("admin.import.importing"),
    progress: t("admin.import.progress"),
    exportButton: t("admin.import.exportButton"),
    exporting: t("admin.import.exporting"),
    resultTitle: t("admin.import.resultTitle"),
    resultCreated: t("admin.import.resultCreated"),
    resultUpdated: t("admin.import.resultUpdated"),
    resultSkipped: t("admin.import.resultSkipped"),
    reasonUnknownCategory: t("admin.import.reasonUnknownCategory"),
    reasonInvalidRow: t("admin.import.reasonInvalidRow"),
    reasonUnknown: t("admin.import.reasonUnknown"),
    errorGeneric: t("admin.import.errorGeneric"),
    exportError: t("admin.import.exportError"),
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-ink">{t("admin.import.title")}</h1>
        <Link
          href="/import-template.csv"
          className="rounded-full border border-blush/60 px-4 py-2 text-sm font-semibold text-ink hover:bg-blush/20"
        >
          {t("admin.import.templateLink")}
        </Link>
      </div>
      <ImportPanel labels={labels} demoMode={isDemoMode()} />
    </div>
  );
}
