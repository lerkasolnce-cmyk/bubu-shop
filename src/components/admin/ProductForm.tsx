"use client";

import { useState, useTransition } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Category, Product } from "@/lib/types";
import { saveProduct } from "@/app/admin/(protected)/products/actions";
import SpecsEditor, { type SpecsEditorLabels } from "./SpecsEditor";
import ImageUploader, { type ImageUploaderLabels } from "./ImageUploader";

export type ProductFormLabels = {
  nameUa: string;
  nameRu: string;
  slug: string;
  slugPlaceholder: string;
  brand: string;
  category: string;
  noCategory: string;
  price: string;
  oldPrice: string;
  stockStatus: string;
  stockInStock: string;
  stockPreorder: string;
  stockOutOfStock: string;
  descriptionUa: string;
  descriptionRu: string;
  isHit: string;
  isSale: string;
  specsTitle: string;
  imagesTitle: string;
  save: string;
  saving: string;
  cancel: string;
  errorGeneric: string;
};

// it/en fields come in a later task — this form only handles ua/ru.
const BRAND_OPTIONS = ["Anex", "Cybex", "Espiro", "Bubu"];

export default function ProductForm({
  categories,
  product,
  labels,
  specsLabels,
  imagesLabels,
}: {
  categories: Category[];
  product?: Product;
  labels: ProductFormLabels;
  specsLabels: SpecsEditorLabels;
  imagesLabels: ImageUploaderLabels;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    setFieldErrors({});

    startTransition(async () => {
      const res = await saveProduct(formData);
      if (!res.ok) {
        // res.error may carry a raw Postgres message — don't surface it verbatim to the UI.
        setError(labels.errorGeneric);
        setFieldErrors(res.fieldErrors ?? {});
        return;
      }
      router.push("/admin/products");
      router.refresh();
    });
  }

  const inputCls =
    "w-full min-w-0 rounded-md border border-ink/15 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:border-mint focus:outline-none";
  const labelCls = "mb-1 block text-sm font-semibold text-ink";

  function fieldError(name: string) {
    const msgs = fieldErrors[name];
    return msgs && msgs.length > 0 ? <p className="mt-1 text-xs text-red-600">{msgs[0]}</p> : null;
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex max-w-3xl flex-col gap-6">
      {product?.id && <input type="hidden" name="id" value={product.id} />}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelCls}>{labels.nameUa}</label>
          <input name="name_ua" defaultValue={product?.name_ua} className={inputCls} required />
          {fieldError("name_ua")}
        </div>
        <div>
          <label className={labelCls}>{labels.nameRu}</label>
          <input name="name_ru" defaultValue={product?.name_ru} className={inputCls} required />
          {fieldError("name_ru")}
        </div>

        <div>
          <label className={labelCls}>{labels.slug}</label>
          <input
            name="slug"
            defaultValue={product?.slug}
            placeholder={labels.slugPlaceholder}
            className={inputCls}
          />
          {fieldError("slug")}
        </div>

        <div>
          <label className={labelCls}>{labels.brand}</label>
          <input name="brand" defaultValue={product?.brand} list="brand-options" className={inputCls} required />
          <datalist id="brand-options">
            {BRAND_OPTIONS.map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
          {fieldError("brand")}
        </div>

        <div>
          <label className={labelCls}>{labels.category}</label>
          <select name="category_id" defaultValue={product?.category_id ?? ""} className={inputCls}>
            <option value="">{labels.noCategory}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_ua}
              </option>
            ))}
          </select>
          {fieldError("category_id")}
        </div>

        <div>
          <label className={labelCls}>{labels.price}</label>
          <input name="price" type="number" min={0} defaultValue={product?.price} className={inputCls} required />
          {fieldError("price")}
        </div>

        <div>
          <label className={labelCls}>{labels.oldPrice}</label>
          <input
            name="old_price"
            type="number"
            min={0}
            defaultValue={product?.old_price ?? ""}
            className={inputCls}
          />
          {fieldError("old_price")}
        </div>

        <div>
          <label className={labelCls}>{labels.stockStatus}</label>
          <select name="stock_status" defaultValue={product?.stock_status ?? "in_stock"} className={inputCls}>
            <option value="in_stock">{labels.stockInStock}</option>
            <option value="preorder">{labels.stockPreorder}</option>
            <option value="out_of_stock">{labels.stockOutOfStock}</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>{labels.descriptionUa}</label>
        <textarea name="description_ua" defaultValue={product?.description_ua} rows={4} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>{labels.descriptionRu}</label>
        <textarea name="description_ru" defaultValue={product?.description_ru} rows={4} className={inputCls} />
      </div>

      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          <input type="checkbox" name="is_hit" defaultChecked={product?.is_hit} className="h-4 w-4 accent-accent" />
          {labels.isHit}
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-ink">
          <input type="checkbox" name="is_sale" defaultChecked={product?.is_sale} className="h-4 w-4 accent-accent" />
          {labels.isSale}
        </label>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-bold text-ink">{labels.specsTitle}</h2>
        <SpecsEditor initial={product?.specs ?? {}} labels={specsLabels} />
      </div>

      <div>
        <h2 className="mb-2 text-sm font-bold text-ink">{labels.imagesTitle}</h2>
        <ImageUploader initial={product?.images ?? []} slugHint={product?.slug ?? ""} labels={imagesLabels} />
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className={
            pending
              ? "cursor-not-allowed rounded-full bg-ink/20 px-5 py-2.5 text-sm font-bold text-white"
              : "rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white transition hover:opacity-90"
          }
        >
          {pending ? labels.saving : labels.save}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          className="rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink hover:bg-ink/5"
        >
          {labels.cancel}
        </button>
      </div>
    </form>
  );
}
