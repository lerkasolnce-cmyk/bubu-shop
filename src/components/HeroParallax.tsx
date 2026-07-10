"use client";

import { useEffect, useRef } from "react";

// Each decorative circle drifts at its own fraction of scroll speed, so the group
// reads as layered depth rather than a single flat shift.
const FACTORS = [0.15, 0.25, 0.1, 0.2];

export default function HeroParallax() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const node = containerRef.current;
    if (!node) return;
    const circles = Array.from(node.children) as HTMLElement[];

    let rafId: number | null = null;

    const update = () => {
      rafId = null;
      const rect = node.getBoundingClientRect();
      // Skip work once the hero has scrolled well out of view.
      if (rect.bottom < -200 || rect.top > window.innerHeight + 200) return;

      const y = window.scrollY;
      circles.forEach((el, i) => {
        el.style.transform = `translate3d(0, ${y * (FACTORS[i] ?? 0.15)}px, 0)`;
      });
    };

    const onScroll = () => {
      if (rafId == null) rafId = requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId != null) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div ref={containerRef} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-mint/40 blur-2xl" />
      <div className="absolute -right-16 top-6 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />
      <div className="absolute -bottom-12 left-1/3 h-32 w-32 rounded-full bg-blush/70 blur-2xl" />
      <div className="absolute bottom-4 right-1/4 h-20 w-20 rounded-full bg-mint/30 blur-xl" />
    </div>
  );
}
