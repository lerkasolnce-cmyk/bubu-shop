import { notFound } from "next/navigation";
import { getLocale, getT } from "@/lib/i18n";
import { createServerClient } from "@/lib/supabase/server";
import { demoProducts, isDemoMode } from "@/lib/demo";
import { fetchCategories } from "@/lib/catalog";
import type { Product } from "@/lib/types";
import ProductForm from "@/components/admin/ProductForm";
import { imageUploaderLabels, productFormLabels, specsEditorLabels } from "../form-labels";

async function loadProduct(id: string): Promise<Product | null> {
  if (isDemoMode()) return demoProducts.find((p) => p.id === id) ?? null;

  try {
    const supabase = await createServerClient();
    const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
    if (error || !data) return null;
    return data as Product;
  } catch {
    return null;
  }
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = getT(await getLocale());

  const [product, categories] = await Promise.all([loadProduct(id), fetchCategories()]);
  if (!product) notFound();

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold text-ink">{t("admin.products.form.editTitle")}</h1>
      <ProductForm
        categories={categories}
        product={product}
        labels={productFormLabels(t)}
        specsLabels={specsEditorLabels(t)}
        imagesLabels={imageUploaderLabels(t)}
      />
    </div>
  );
}
