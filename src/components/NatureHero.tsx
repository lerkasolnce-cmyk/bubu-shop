"use client";

import Link from "next/link";
import { useLayoutEffect, useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// useLayoutEffect is a no-op (with a dev warning) during SSR — fall back to useEffect
// on the server, mirroring the isomorphic pattern used in Reveal.tsx.
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

// The storybook nature sequence: the baby crawls along the path, butterflies
// flutter, and the stroller fades in on the path near the end. One continuous
// scrubbed sequence — the text overlay is persistent (it sits on the calm sky).
const FRAME_COUNT = 121;
const FRAME_DIR = "/anim/nature/";
const FRAME_W = 1408;
const FRAME_H = 792;
const LAST_FRAME = `${FRAME_DIR}n121.webp`;

// Cover-fit focus: keep the path/baby area in view when the stage crops the
// 16:9 frame (e.g. portrait phones). X biases toward the left-center where the
// story happens; Y biases toward the ground.
const FOCUS_X = 0.42;
const FOCUS_Y = 0.62;

function frameUrl(n: number) {
  return `${FRAME_DIR}n${String(n).padStart(3, "0")}.webp`;
}

export default function NatureHero({
  title,
  subtitle,
  cta,
  ctaHref = "/catalog/strollers-2in1",
}: {
  title: string;
  subtitle: string;
  cta: string;
  ctaHref?: string;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Default to the "safe" static state (last frame) so SSR/no-JS/reduced-motion
  // users always see a correct, complete hero with zero CLS. Only flipped once
  // we've confirmed (client-side) that motion is allowed.
  const [animated, setAnimated] = useState(false);

  useIsomorphicLayoutEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setAnimated(true);
  }, []);

  useGSAP(
    () => {
      if (!animated) return;
      const section = sectionRef.current;
      const pin = pinRef.current;
      const stage = stageRef.current;
      const canvas = canvasRef.current;
      if (!section || !pin || !stage || !canvas) return;

      const ctx = canvas.getContext("2d");

      // --- Frame preloading -------------------------------------------------
      const images: (HTMLImageElement | null)[] = new Array(FRAME_COUNT).fill(null);
      let wantedIndex = 1; // 1-based frame the canvas currently wants

      const loadFrame = (n: number) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          let settled = false;
          const done = () => {
            if (settled) return;
            settled = true;
            images[n - 1] = img;
            // Repaint if this frame is at (or before) the wanted one: covers the
            // very first paint (nothing was loaded when render(0) ran) and "held"
            // frames upgrading to the real one during slow loads.
            if (n <= wantedIndex) drawCurrentFrame();
            resolve();
          };
          // `load`/`error` are the reliable completion signal (decode() can be
          // deferred for hidden tabs); decode() runs as a fire-and-forget warm-up.
          img.onload = () => {
            done();
            if (typeof img.decode === "function") img.decode().catch(() => {});
          };
          img.onerror = done;
          img.src = frameUrl(n);
        });

      let cancelled = false;
      (async () => {
        for (let n = 1; n <= 20 && !cancelled; n++) {
          await loadFrame(n);
        }
        for (let n = 21; n <= FRAME_COUNT && !cancelled; n++) {
          await loadFrame(n);
        }
      })();

      // --- Canvas sizing (cover-fit, DPR-aware) -----------------------------
      let stageW = 0;
      let stageH = 0;

      function layoutStage() {
        const rect = stage!.getBoundingClientRect();
        stageW = rect.width;
        stageH = rect.height;

        const dpr = window.devicePixelRatio || 1;
        canvas!.width = Math.round(stageW * dpr);
        canvas!.height = Math.round(stageH * dpr);
        canvas!.style.width = `${stageW}px`;
        canvas!.style.height = `${stageH}px`;
        ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);

        drawCurrentFrame();
      }

      function nearestLoaded(want: number): HTMLImageElement | null {
        for (let i = Math.max(1, want); i >= 1; i--) {
          const im = images[i - 1];
          if (im) return im;
        }
        return images.find((im) => im !== null) ?? null;
      }

      function drawCurrentFrame() {
        if (!ctx || !stageW || !stageH) return;
        const img = nearestLoaded(wantedIndex);
        if (!img) return;
        // Cover-fit with a focus point so the story area survives cropping.
        const scale = Math.max(stageW / FRAME_W, stageH / FRAME_H);
        const w = FRAME_W * scale;
        const h = FRAME_H * scale;
        const x = -(w - stageW) * FOCUS_X;
        const y = -(h - stageH) * FOCUS_Y;
        ctx.clearRect(0, 0, stageW, stageH);
        ctx.drawImage(img, x, y, w, h);
      }

      layoutStage();

      // --- rAF-deduped render, driven by ScrollTrigger progress -------------
      let rafId: number | null = null;
      let pendingProgress = 0;

      function render(p: number) {
        rafId = null;
        wantedIndex = Math.min(FRAME_COUNT, Math.max(1, Math.round(1 + p * (FRAME_COUNT - 1))));
        drawCurrentFrame();
      }

      function scheduleRender(p: number) {
        pendingProgress = p;
        if (rafId == null) {
          rafId = requestAnimationFrame(() => render(pendingProgress));
        }
      }

      // Initial paint, synchronous on purpose: rAF can be throttled in hidden tabs.
      render(0);

      const isTouch = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
      section.style.setProperty("--scene-height", isTouch ? "240vh" : "300vh");

      const trigger = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
        pin,
        onUpdate: (self) => scheduleRender(self.progress),
      });

      // Keeps geometry in sync on resizes and recovers from a degenerate first
      // measurement (page mounted in a hidden/backgrounded tab).
      let lastW = 0;
      let lastH = 0;
      const resizeObserver = new ResizeObserver((entries) => {
        const { width, height } = entries[0].contentRect;
        if (width === lastW && height === lastH) return;
        lastW = width;
        lastH = height;
        trigger.refresh();
        layoutStage();
        render(pendingProgress);
      });
      resizeObserver.observe(section);

      return () => {
        cancelled = true;
        resizeObserver.disconnect();
        trigger.kill();
        if (rafId != null) cancelAnimationFrame(rafId);
      };
    },
    { dependencies: [animated], scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className="relative"
      style={{ height: animated ? "var(--scene-height, 300vh)" : undefined }}
    >
      <div ref={pinRef} className="relative h-screen w-full overflow-hidden bg-[#EDE9DA]">
        <div ref={stageRef} className="absolute inset-0">
          <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden />
          {!animated && (
            // Pre-hydration / reduced-motion / no-JS state: last frame, statically.
            <img
              src={LAST_FRAME}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-cover"
              style={{ objectPosition: `${FOCUS_X * 100}% ${FOCUS_Y * 100}%` }}
            />
          )}
        </div>

        {/* Persistent text overlay on the calm sky area (per the reference mock):
            top-centered on small screens, top-left on large ones. */}
        <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col items-center px-4 pt-[10vh] text-center lg:items-start lg:pl-12 lg:text-left">
          <h1 className="max-w-xl text-3xl font-extrabold leading-tight text-ink sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-md text-base text-ink/70 sm:text-lg">{subtitle}</p>
          <Link
            href={ctaHref}
            className="mt-8 inline-block rounded-full bg-accent px-8 py-3 text-base font-bold text-cream shadow-sm transition hover:opacity-90"
          >
            {cta}
          </Link>
        </div>
      </div>
    </section>
  );
}
