"use client";

import { useState } from "react";
import Image from "next/image";

function StrollerPlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-cream">
      <svg viewBox="0 0 64 64" className="h-24 w-24 text-ink/25" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14 30c0-10 7-18 16-18 8 0 13 5 15 12" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M10 30h38l-3 8a6 6 0 0 1-5.7 4H20a6 6 0 0 1-5.8-4.5L12 30Z" />
        <circle cx="20" cy="48" r="4" />
        <circle cx="42" cy="48" r="4" />
        <path strokeLinecap="round" d="M45 12l6-4" />
      </svg>
    </div>
  );
}

export default function Gallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);

  if (images.length === 0) {
    return (
      <div className="aspect-square w-full overflow-hidden rounded-lg border border-blush/40">
        <StrollerPlaceholder />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-lg border border-blush/40 bg-white">
        <Image
          src={images[active]}
          alt={alt}
          fill
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover"
          priority
        />
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto">
          {images.map((image, i) => (
            <button
              key={image + i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`${alt} ${i + 1}`}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 transition ${
                i === active ? "border-accent" : "border-transparent"
              }`}
            >
              <Image src={image} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
