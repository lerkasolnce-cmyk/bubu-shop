import { getLocale, getT } from "@/lib/i18n";
import { fetchCategories } from "@/lib/catalog";
import CategoriesTable, { type CategoryLabels } from "@/components/admin/CategoriesTable";

export default async function AdminCategoriesPage() {
  const t = getT(await getLocale());
  const categories = await fetchCategories();

  const labels: CategoryLabels = {
    colNameUa: t("admin.categories.colNameUa"),
    colNameRu: t("admin.categories.colNameRu"),
    colSlug: t("admin.categories.colSlug"),
    colParent: t("admin.categories.colParent"),
    colSort: t("admin.categories.colSort"),
    colActions: t("admin.categories.colActions"),
    parentRoot: t("admin.categories.parentRoot"),
    add: t("admin.categories.add"),
    save: t("admin.categories.save"),
    saving: t("admin.categories.saving"),
    delete: t("admin.categories.delete"),
    deleteConfirm: t("admin.categories.deleteConfirm"),
    deleteError: t("admin.categories.deleteError"),
    saveError: t("admin.categories.saveError"),
    hasProducts: t("admin.categories.hasProducts"),
    hasChildren: t("admin.categories.hasChildren"),
    invalidParent: t("admin.categories.invalidParent"),
    empty: t("admin.categories.empty"),
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold text-ink">{t("admin.nav.categories")}</h1>
      <CategoriesTable initialCategories={categories} labels={labels} />
    </div>
  );
}
