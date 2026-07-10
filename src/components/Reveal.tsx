"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

// useLayoutEffect is a no-op (with a dev warning) during SSR — fall back to useEffect
// on the server so the same component works isomorphically without console noise.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export default function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  /** Stagger delay in ms, applied via `transition-delay` once the element starts animating. */
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  // Default state is always "visible" — content must never be hidden without JS/IntersectionObserver.
  const [hidden, setHidden] = useState(false);

  useIsomorphicLayoutEffect(() => {
    if (typeof window === "undefined") return;
    if (typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const node = ref.current;
    if (!node) return;

    // Flip to hidden before paint (layout effect), then reveal on first intersection.
    setHidden(true);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setHidden(false);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-500 ease-out ${hidden ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100"} ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
