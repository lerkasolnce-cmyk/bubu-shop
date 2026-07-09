import type { ProductFormLabels } from "@/components/admin/ProductForm";
import type { SpecsEditorLabels } from "@/components/admin/SpecsEditor";
import type { ImageUploaderLabels } from "@/components/admin/ImageUploader";

// Shared between new/page.tsx and [id]/page.tsx so the two never drift apart.
type T = (key: string) => string;

export function productFormLabels(t: T): ProductFormLabels {
  return {
    nameUa: t("admin.products.form.nameUa"),
    nameRu: t("admin.products.form.nameRu"),
    slug: t("admin.products.form.slug"),
    slugPlaceholder: t("admin.products.form.slugPlaceholder"),
    brand: t("admin.products.form.brand"),
    category: t("admin.products.form.category"),
    noCategory: t("admin.products.noCategory"),
    price: t("admin.products.form.price"),
    oldPrice: t("admin.products.form.oldPrice"),
    stockStatus: t("admin.products.form.stockStatus"),
    stockInStock: t("product.inStock"),
    stockPreorder: t("product.preorder"),
    stockOutOfStock: t("product.outOfStock"),
    descriptionUa: t("admin.products.form.descriptionUa"),
    descriptionRu: t("admin.products.form.descriptionRu"),
    isHit: t("admin.products.form.isHit"),
    isSale: t("admin.products.form.isSale"),
    specsTitle: t("admin.products.form.specsTitle"),
    imagesTitle: t("admin.products.form.imagesTitle"),
    save: t("admin.products.form.save"),
    saving: t("admin.products.form.saving"),
    cancel: t("admin.products.form.cancel"),
    errorGeneric: t("admin.products.form.errorGeneric"),
  };
}

export function specsEditorLabels(t: T): SpecsEditorLabels {
  return {
    key: t("admin.specs.key"),
    value: t("admin.specs.value"),
    add: t("admin.specs.add"),
    remove: t("admin.specs.remove"),
  };
}

export function imageUploaderLabels(t: T): ImageUploaderLabels {
  return {
    addFiles: t("admin.images.addFiles"),
    demoNotice: t("admin.images.demoNotice"),
    tooLarge: t("admin.images.tooLarge"),
    uploadError: t("admin.images.uploadError"),
    moveLeft: t("admin.images.moveLeft"),
    moveRight: t("admin.images.moveRight"),
    deleteAlt: t("admin.images.deleteAlt"),
    uploading: t("admin.images.uploading"),
  };
}
