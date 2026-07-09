import { getLocale, getT } from "@/lib/i18n";
import { fetchCategories } from "@/lib/catalog";
import ProductForm from "@/components/admin/ProductForm";
import { imageUploaderLabels, productFormLabels, specsEditorLabels } from "../form-labels";

export default async function NewProductPage() {
  const t = getT(await getLocale());
  const categories = await fetchCategories();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold text-ink">{t("admin.products.form.newTitle")}</h1>
      <ProductForm
        categories={categories}
        labels={productFormLabels(t)}
        specsLabels={specsEditorLabels(t)}
        imagesLabels={imageUploaderLabels(t)}
      />
    </div>
  );
}
