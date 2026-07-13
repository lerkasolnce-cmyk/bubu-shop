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

// The last stretch of the pin is the exit transition: the final frame breaks
// into petal-like tiles that flutter away (bottom rows lift first, as if a
// breeze sweeps up), while a cream wave rises to hand over to the next section.
const FRAMES_END = 0.8; // frame scrub occupies [0, FRAMES_END]; scatter is the rest
const SCATTER_RISE = 0.55; // how far tiles rise, as a fraction of stage height
const SCATTER_DRIFT = 0.3; // max sideways drift, as a fraction of stage width
// Background blends from the scene's sky tone to the page cream during the exit.
const BG_FROM = [237, 233, 218];
const BG_TO = [251, 247, 240];

function frameUrl(n: number) {
  return `${FRAME_DIR}n${String(n).padStart(3, "0")}.webp`;
}

// Deterministic per-tile pseudo-randomness: stable across renders, so scrubbing
// back and forth replays the exact same flutter.
function hash(i: number) {
  const x = Math.sin(i * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export default function NatureHero({
  title,
  subtitle,
  cta,
  ctaHref = "/catalog/strollers-2in1",
  children,
}: {
  title: string;
  subtitle: string;
  cta: string;
  ctaHref?: string;
  // Rendered as an overlay that drops in during the petal transition (the
  // category cards) and remains standing on the risen wave at the pin's end.
  children?: React.ReactNode;
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const waveRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

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
      const text = textRef.current;
      const wave = waveRef.current;
      const cardsWrap = cardsRef.current;
      if (!section || !pin || !stage || !canvas || !text || !wave) return;
      const cards: HTMLElement[] = cardsWrap
        ? (gsap.utils.toArray("[data-hero-card]", cardsWrap) as HTMLElement[])
        : [];

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
      // Offscreen copy of the LAST frame at stage size — the scatter transition
      // slices its tiles out of this. Rebuilt on resize and when the frame loads.
      const offscreen = document.createElement("canvas");
      const offCtx = offscreen.getContext("2d");
      let offscreenReady = false;
      // Tile grid for the petal scatter (coarser on small screens).
      let cols = 24;
      let rows = 14;

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

        cols = stageW < 768 ? 14 : 24;
        rows = stageW < 768 ? 9 : 14;
        offscreen.width = Math.round(stageW);
        offscreen.height = Math.round(stageH);
        offscreenReady = false; // stale size — rebuild lazily

        drawCurrentFrame();
      }

      function coverRect() {
        const scale = Math.max(stageW / FRAME_W, stageH / FRAME_H);
        const w = FRAME_W * scale;
        const h = FRAME_H * scale;
        return { x: -(w - stageW) * FOCUS_X, y: -(h - stageH) * FOCUS_Y, w, h };
      }

      function ensureOffscreen(): boolean {
        if (offscreenReady) return true;
        if (!offCtx || !stageW || !stageH) return false;
        const img = nearestLoaded(FRAME_COUNT);
        if (!img) return false;
        const { x, y, w, h } = coverRect();
        offCtx.clearRect(0, 0, offscreen.width, offscreen.height);
        offCtx.drawImage(img, x, y, w, h);
        offscreenReady = true;
        return true;
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
        const { x, y, w, h } = coverRect();
        ctx.clearRect(0, 0, stageW, stageH);
        ctx.drawImage(img, x, y, w, h);
      }

      // The petal scatter: slice the final frame into tiles; each tile lifts,
      // drifts sideways, spins and fades with its own (deterministic) delay —
      // bottom rows first, like a breeze sweeping up the page.
      function drawScatter(t: number) {
        if (!ctx || !stageW || !stageH) return;
        if (!ensureOffscreen()) return;
        ctx.clearRect(0, 0, stageW, stageH);
        const tileW = offscreen.width / cols;
        const tileH = offscreen.height / rows;
        // CSS-pixel tile size (offscreen is CSS-sized; ctx transform handles dpr).
        const outW = stageW / cols;
        const outH = stageH / rows;
        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const i = r * cols + c;
            // Bottom rows release first; per-tile jitter keeps it organic.
            const delay = ((rows - 1 - r) / rows) * 0.45 + hash(i) * 0.2;
            const tau = Math.min(1, Math.max(0, (t - delay) / Math.max(0.001, 1 - delay)));
            const alpha = 1 - tau;
            if (alpha <= 0.01) continue;
            const cx = c * outW + outW / 2;
            const cy = r * outH + outH / 2;
            if (tau <= 0) {
              ctx.drawImage(offscreen, c * tileW, r * tileH, tileW, tileH, c * outW, r * outH, outW, outH);
              continue;
            }
            const rise = (0.5 + hash(i + 1) * 0.5) * SCATTER_RISE * stageH * tau * tau;
            const drift = (hash(i + 2) - 0.5) * 2 * SCATTER_DRIFT * stageW * tau;
            const spin = (hash(i + 3) - 0.5) * 2 * Math.PI * 0.7 * tau;
            const scale = 1 - 0.35 * tau;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(cx + drift, cy - rise);
            ctx.rotate(spin);
            ctx.scale(scale, scale);
            ctx.drawImage(offscreen, c * tileW, r * tileH, tileW, tileH, -outW / 2, -outH / 2, outW, outH);
            ctx.restore();
          }
        }
        ctx.globalAlpha = 1;
      }

      layoutStage();

      // --- rAF-deduped render, driven by ScrollTrigger progress -------------
      let rafId: number | null = null;
      let pendingProgress = 0;

      function render(p: number) {
        rafId = null;
        if (p < FRAMES_END) {
          // Frame scrub segment: story plays over [0, FRAMES_END].
          const local = p / FRAMES_END;
          wantedIndex = Math.min(FRAME_COUNT, Math.max(1, Math.round(1 + local * (FRAME_COUNT - 1))));
          drawCurrentFrame();
          gsap.set(text, { opacity: 1, y: 0 });
          gsap.set(wave, { yPercent: 100 });
          pin!.style.backgroundColor = `rgb(${BG_FROM[0]}, ${BG_FROM[1]}, ${BG_FROM[2]})`;
          if (cardsWrap) cardsWrap.style.pointerEvents = "none";
          cards.forEach((card) => gsap.set(card, { opacity: 0, y: -window.innerHeight * 0.45 }));
        } else {
          // Exit transition: petals scatter, text fades, the cream wave rises,
          // the background blends into the page colour — and the category cards
          // drop in from above (staggered), landing on the risen wave.
          const t = (p - FRAMES_END) / (1 - FRAMES_END);
          wantedIndex = FRAME_COUNT;
          drawScatter(t);
          const textFade = Math.min(1, t / 0.3);
          gsap.set(text, { opacity: 1 - textFade, y: -24 * textFade });
          gsap.set(wave, { yPercent: 100 - Math.min(1, t * 1.15) * 100 });
          const mix = (k: number) => Math.round(BG_FROM[k] + (BG_TO[k] - BG_FROM[k]) * t);
          pin!.style.backgroundColor = `rgb(${mix(0)}, ${mix(1)}, ${mix(2)})`;

          cards.forEach((card, i) => {
            // Staggered drop: card i starts falling at delay_i and lands softly
            // (decelerating curve). Scrub-driven, fully reversible.
            const delay = 0.22 + i * 0.09;
            const tau = Math.min(1, Math.max(0, (t - delay) / 0.4));
            const ease = 1 - (1 - tau) * (1 - tau); // ease-out quad
            gsap.set(card, {
              opacity: Math.min(1, tau * 1.6),
              y: -window.innerHeight * 0.45 * (1 - ease),
              rotation: (hash(i + 7) - 0.5) * 6 * (1 - ease),
            });
          });
          if (cardsWrap) cardsWrap.style.pointerEvents = t > 0.85 ? "auto" : "none";
        }
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
      // A bit longer than the plain scrub: the tail hosts the petal transition.
      section.style.setProperty("--scene-height", isTouch ? "280vh" : "340vh");

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

        {/* Cream wave that rises from the bottom during the petal transition,
            handing the eye over to the next section. Hidden below by default. */}
        <div
          ref={waveRef}
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-[26vh]"
          style={{ transform: "translateY(100%)" }}
        >
          <svg
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
            className="block h-12 w-full text-cream sm:h-16"
          >
            <path
              fill="currentColor"
              d="M0,64 C240,110 480,10 720,42 C960,74 1200,20 1440,58 L1440,120 L0,120 Z"
            />
          </svg>
          <div className="h-full w-full bg-cream" />
        </div>

        {/* Category cards: drop in during the petal transition and stay standing
            on the risen wave (visible immediately in the static fallback). */}
        {children && (
          <div
            ref={cardsRef}
            className="absolute inset-x-0 bottom-0 z-20 pb-[7vh]"
            style={{ pointerEvents: animated ? "none" : "auto" }}
          >
            {children}
          </div>
        )}

        {/* Persistent text overlay on the calm sky area (per the reference mock):
            top-centered on small screens, top-left on large ones. */}
        <div
          ref={textRef}
          className="relative z-10 mx-auto flex h-full max-w-6xl flex-col items-center px-4 pt-[10vh] text-center lg:items-start lg:pl-12 lg:text-left"
        >
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
