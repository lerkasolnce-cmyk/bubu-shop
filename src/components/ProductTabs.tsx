"use client";

import { useState } from "react";
import type { ReactNode } from "react";

export default function ProductTabs({
  description,
  descriptionLabel,
  specs,
  specsLabel,
}: {
  description?: string;
  descriptionLabel: string;
  specs?: ReactNode;
  specsLabel: string;
}) {
  const hasDescription = !!description;
  const hasSpecs = !!specs;
  const [active, setActive] = useState<"description" | "specs">(hasDescription ? "description" : "specs");

  if (!hasDescription && !hasSpecs) return null;

  return (
    <section>
      <div className="mb-4 flex gap-2">
        {hasDescription && (
          <button
            type="button"
            onClick={() => setActive("description")}
            className={
              active === "description"
                ? "rounded-full bg-accent px-5 py-2 text-sm font-bold text-cream"
                : "rounded-full bg-blush/30 px-5 py-2 text-sm font-semibold text-ink/60 transition hover:bg-blush/50"
            }
          >
            {descriptionLabel}
          </button>
        )}
        {hasSpecs && (
          <button
            type="button"
            onClick={() => setActive("specs")}
            className={
              active === "specs"
                ? "rounded-full bg-accent px-5 py-2 text-sm font-bold text-cream"
                : "rounded-full bg-blush/30 px-5 py-2 text-sm font-semibold text-ink/60 transition hover:bg-blush/50"
            }
          >
            {specsLabel}
          </button>
        )}
      </div>

      {hasDescription && active === "description" && (
        <p className="whitespace-pre-line text-ink/80">{description}</p>
      )}
      {hasSpecs && active === "specs" && specs}
    </section>
  );
}
