"use client";

import { useState } from "react";
import Image from "next/image";
import { createBrowserClient } from "@/lib/supabase/client";

export type ImageUploaderLabels = {
  addFiles: string;
  demoNotice: string;
  tooLarge: string;
  uploadError: string;
  moveLeft: string;
  moveRight: string;
  deleteAlt: string;
  uploading: string;
};

const MAX_SIZE = 5 * 1024 * 1024;
const BUCKET = "products";

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

/** Recovers the storage object path from a Supabase public URL, for best-effort deletes. */
function extractStoragePath(publicUrl: string): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(publicUrl.slice(idx + marker.length));
}

type PendingUpload = { id: string; name: string };

export default function ImageUploader({
  initial,
  slugHint,
  labels,
}: {
  initial: string[];
  slugHint: string;
  labels: ImageUploaderLabels;
}) {
  const [images, setImages] = useState<string[]>(initial);
  const [pending, setPending] = useState<PendingUpload[]>([]);
  const [error, setError] = useState<string | null>(null);

  // NEXT_PUBLIC_ vars are inlined at build time, so this is a plain value check —
  // no client ever eagerly constructs a Supabase client without env configured.
  const isDemoMode = !process.env.NEXT_PUBLIC_SUPABASE_URL;

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    const supabase = createBrowserClient();

    for (const file of Array.from(fileList)) {
      if (file.size > MAX_SIZE) {
        setError(labels.tooLarge);
        continue;
      }

      const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setPending((prev) => [...prev, { id: uploadId, name: file.name }]);

      try {
        const path = `${slugHint || "misc"}/${Date.now()}-${sanitizeFileName(file.name)}`;
        const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file);
        if (uploadError) {
          setError(labels.uploadError);
        } else {
          const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
          setImages((prev) => [...prev, data.publicUrl]);
        }
      } catch {
        setError(labels.uploadError);
      } finally {
        setPending((prev) => prev.filter((p) => p.id !== uploadId));
      }
    }
  }

  async function removeImage(i: number) {
    const url = images[i];
    setImages((prev) => prev.filter((_, idx) => idx !== i));

    try {
      const path = extractStoragePath(url);
      if (path) {
        const supabase = createBrowserClient();
        await supabase.storage.from(BUCKET).remove([path]);
      }
    } catch {
      // Storage cleanup is best-effort — the image is already gone from the list either way.
    }
  }

  function move(i: number, dir: -1 | 1) {
    setImages((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const copy = prev.slice();
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }

  const json = JSON.stringify(images);

  if (isDemoMode) {
    return (
      <div className="flex flex-col gap-2">
        <input type="hidden" name="images" value={json} readOnly />
        <p className="rounded-md border border-ink/10 bg-ink/5 px-3 py-2 text-xs text-ink/50">{labels.demoNotice}</p>
        <input type="file" disabled className="text-sm text-ink/40" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <input type="hidden" name="images" value={json} readOnly />

      {(images.length > 0 || pending.length > 0) && (
        <div className="flex flex-wrap gap-3">
          {images.map((src, i) => (
            <div key={src + i} className="relative h-24 w-24 overflow-hidden rounded-md border border-blush/40 bg-cream">
              <Image src={src} alt="" fill sizes="96px" className="object-cover" />
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/55 px-1 py-0.5">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  className="px-1 text-xs text-white disabled:opacity-30"
                >
                  {labels.moveLeft}
                </button>
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  aria-label={labels.deleteAlt}
                  className="px-1 text-xs text-white"
                >
                  ✕
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === images.length - 1}
                  className="px-1 text-xs text-white disabled:opacity-30"
                >
                  {labels.moveRight}
                </button>
              </div>
            </div>
          ))}
          {pending.map((p) => (
            <div
              key={p.id}
              className="flex h-24 w-24 items-center justify-center rounded-md border border-blush/40 bg-cream/60"
            >
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-ink/25 border-t-ink" />
            </div>
          ))}
        </div>
      )}

      <label className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-full border border-blush/60 px-4 py-2 text-sm font-semibold text-ink hover:bg-blush/20">
        {labels.addFiles}
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </label>
      {pending.length > 0 && <p className="text-xs text-ink/50">{labels.uploading}</p>}

      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
