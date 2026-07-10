"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@/lib/types";
import { saveCategory, deleteCategory } from "@/app/admin/(protected)/categories/actions";

export type CategoryLabels = {
  colNameUa: string;
  colNameRu: string;
  colSlug: string;
  colParent: string;
  colSort: string;
  colActions: string;
  parentRoot: string;
  add: string;
  save: string;
  saving: string;
  delete: string;
  deleteConfirm: string;
  deleteError: string;
  saveError: string;
  hasProducts: string; // contains a literal "{count}" placeholder
  hasChildren: string;
  invalidParent: string;
  empty: string;
};

export default function CategoryRow({
  category,
  rootOptions,
  labels,
  onSaved,
  onDeleted,
}: {
  category: Category;
  rootOptions: Category[];
  labels: CategoryLabels;
  onSaved: (saved: Category) => void;
  onDeleted: () => void;
}) {
  const router = useRouter();
  const [nameUa, setNameUa] = useState(category.name_ua);
  const [nameRu, setNameRu] = useState(category.name_ru);
  const [slug, setSlug] = useState(category.slug);
  const [parentId, setParentId] = useState(category.parent_id ?? "");
  const [sort, setSort] = useState(category.sort);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    const fd = new FormData();
    if (category.id) fd.append("id", category.id);
    fd.append("name_ua", nameUa);
    fd.append("name_ru", nameRu);
    fd.append("slug", slug);
    fd.append("parent_id", parentId);
    fd.append("sort", String(sort));

    startTransition(async () => {
      const res = await saveCategory(fd);
      if (!res.ok || !res.id) {
        // res.error may carry a raw Postgres message/code — log it, show only the localized label.
        console.error("saveCategory:", res.error);
        setError(res.error === "invalid_parent" ? labels.invalidParent : labels.saveError);
        return;
      }
      onSaved({
        id: res.id,
        name_ua: nameUa,
        name_ru: nameRu,
        slug,
        parent_id: parentId ? parentId : null,
        sort,
      });
      router.refresh();
    });
  }

  function handleDelete() {
    if (!window.confirm(labels.deleteConfirm)) return;
    setError(null);

    // Unsaved row (never persisted) — just drop it locally, no server round-trip.
    if (!category.id) {
      onDeleted();
      return;
    }

    startTransition(async () => {
      const res = await deleteCategory(category.id);
      if (!res.ok) {
        console.error("deleteCategory:", res.error);
        if (res.error === "has_products") {
          setError(labels.hasProducts.replace("{count}", String(res.count ?? 0)));
        } else if (res.error === "has_children") {
          setError(labels.hasChildren);
        } else {
          setError(labels.deleteError);
        }
        return;
      }
      onDeleted();
      router.refresh();
    });
  }

  const inputCls =
    "w-full min-w-0 rounded-md border border-ink/15 bg-white px-2 py-1 text-sm text-ink placeholder:text-ink/40 focus:border-mint focus:outline-none";

  return (
    <tr className="border-b border-blush/20 align-top last:border-0">
      <td className="px-3 py-2">
        <input value={nameUa} onChange={(e) => setNameUa(e.target.value)} className={inputCls} disabled={pending} />
      </td>
      <td className="px-3 py-2">
        <input value={nameRu} onChange={(e) => setNameRu(e.target.value)} className={inputCls} disabled={pending} />
      </td>
      <td className="px-3 py-2">
        <input value={slug} onChange={(e) => setSlug(e.target.value)} className={inputCls} disabled={pending} />
      </td>
      <td className="px-3 py-2">
        <select value={parentId} onChange={(e) => setParentId(e.target.value)} className={inputCls} disabled={pending}>
          <option value="">{labels.parentRoot}</option>
          {rootOptions.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name_ua}
            </option>
          ))}
        </select>
      </td>
      <td className="px-3 py-2">
        <input
          type="number"
          value={sort}
          onChange={(e) => setSort(parseInt(e.target.value, 10) || 0)}
          className={`${inputCls} w-20`}
          disabled={pending}
        />
      </td>
      <td className="px-3 py-2 text-right">
        <div className="flex flex-col items-end gap-1">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={pending}
              className="rounded-md border border-mint bg-mint/30 px-2.5 py-1 text-xs font-semibold text-ink hover:bg-mint/50 disabled:opacity-50"
            >
              {pending ? labels.saving : labels.save}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={pending}
              className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
            >
              {labels.delete}
            </button>
          </div>
          {error && <span className="max-w-[16rem] text-right text-xs text-red-600">{error}</span>}
        </div>
      </td>
    </tr>
  );
}
