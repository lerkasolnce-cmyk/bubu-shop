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

const FRAME_COUNT = 100;
const FRAME_DIR = "/anim/seq/";
const LAST_FRAME = `${FRAME_DIR}f100.webp`;

function frameUrl(n: number) {
  return `${FRAME_DIR}f${String(n).padStart(3, "0")}.webp`;
}

// Phase boundaries (fractions of total scroll progress through the pinned section).
const PHASE_A_END = 0.22; // wheel falls + bounces
const PHASE_B_END = 0.42; // wheel rolls in, ends matching frame f001's wheel exactly
const PHASE_D_START = 0.88; // last stretch: frames 96-100 + text fade-in

// Wheel geometry, measured pixel-exactly from the source assets (see task-17-report.md):
// - f001.webp (1440x810): wheel circle spans x 405..1035, y 101..723 → center
//   (0.5 of width, 0.5086 of height), width 630px (= 0.4375 of frame width).
// - wheel.webp (800x800): circle spans x 26..774, y 22..759 → center (0.5, 0.4881
//   of side), width 748px (= 0.935 of side).
// The wheel <img> is sized/positioned so its circle lands exactly on f001's circle
// (in the canvas' contain-fitted frame box) when phase B ends, making the img→canvas
// swap at 0.42 invisible. All fractions are relative to the DRAWN frame box
// (drawW×drawH), not the raw stage, so letterboxed/mobile layouts stay correct.
const WHEEL_IMG_SIDE_FRACTION_OF_DRAW_W = (630 / 1440) * (800 / 748); // ≈ 0.4679
const F001_CIRCLE_CENTER_Y_FRACTION = 0.5086; // of drawn frame height
const CIRCLE_CENTER_Y_IN_WHEEL_IMG = 0.4881; // of wheel img side
const CIRCLE_DIAMETER_FRACTION_OF_WHEEL_IMG = 0.935; // of wheel img side

// Piecewise-linear "bounce" keyframes for phase A, expressed as fractions of the fall
// distance (y) and small rotation/squash accents. Scrub-driven, so every segment is a
// straight line (ease: none) — the bounce shape comes from the keyframe placement, not
// from eased tweens.
const BOUNCE_KEYFRAMES: { t: number; y: number; rotate: number; scaleY: number }[] = [
  { t: 0, y: -1, rotate: -8, scaleY: 1 },
  { t: 0.45, y: 0, rotate: 0, scaleY: 0.82 }, // first impact, squash
  { t: 0.58, y: -0.22, rotate: 10, scaleY: 1 }, // first bounce up
  { t: 0.72, y: 0, rotate: 0, scaleY: 0.92 }, // second impact, smaller squash
  { t: 0.82, y: -0.08, rotate: -4, scaleY: 1 }, // second bounce up
  { t: 1, y: 0, rotate: 0, scaleY: 1 }, // settled
];

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function sampleKeyframes(t: number) {
  const clamped = Math.min(1, Math.max(0, t));
  for (let i = 0; i < BOUNCE_KEYFRAMES.length - 1; i++) {
    const cur = BOUNCE_KEYFRAMES[i];
    const next = BOUNCE_KEYFRAMES[i + 1];
    if (clamped >= cur.t && clamped <= next.t) {
      const local = next.t === cur.t ? 0 : (clamped - cur.t) / (next.t - cur.t);
      return {
        y: lerp(cur.y, next.y, local),
        rotate: lerp(cur.rotate, next.rotate, local),
        scaleY: lerp(cur.scaleY, next.scaleY, local),
      };
    }
  }
  const last = BOUNCE_KEYFRAMES[BOUNCE_KEYFRAMES.length - 1];
  return { y: last.y, rotate: last.rotate, scaleY: last.scaleY };
}

export default function ScrollScene({
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
  const wheelRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const fallbackImgRef = useRef<HTMLImageElement>(null);

  // Default to the "safe" static state (last frame + visible text) so SSR/no-JS/
  // reduced-motion users always see a correct, complete hero with zero CLS. Only
  // flipped once we've confirmed (client-side) that motion is allowed.
  const [animated, setAnimated] = useState(false);
  const [textHidden, setTextHidden] = useState(false);

  // Hide the SSR-visible text before first paint if we're about to animate, so there is
  // no flash of the final-state text before the scene mounts. Mirrors Reveal.tsx.
  useIsomorphicLayoutEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setAnimated(true);
    setTextHidden(true);
  }, []);

  useGSAP(
    () => {
      if (!animated) return;
      const section = sectionRef.current;
      const pin = pinRef.current;
      const stage = stageRef.current;
      const wheel = wheelRef.current;
      const canvas = canvasRef.current;
      const text = textRef.current;
      if (!section || !pin || !stage || !wheel || !canvas || !text) return;

      const ctx = canvas.getContext("2d");

      // --- Frame preloading -------------------------------------------------
      const images: (HTMLImageElement | null)[] = new Array(FRAME_COUNT).fill(null);
      let lastDrawnIndex = 0; // 1-based frame currently on the canvas (or last available)

      const loadFrame = (n: number) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          let settled = false;
          const done = () => {
            if (settled) return;
            settled = true;
            images[n - 1] = img;
            resolve();
          };
          // `load`/`error` fire on network fetch and are the reliable completion
          // signal — they resolve even in hidden/backgrounded tabs. `decode()`, by
          // contrast, can be deferred indefinitely for hidden or offscreen images,
          // so it must never gate preloading: mark the frame available on `load`
          // (drawImage decodes synchronously if needed) and kick off decode() as a
          // fire-and-forget warm-up so the first scrub paint is smoother.
          img.onload = () => {
            done();
            if (typeof img.decode === "function") img.decode().catch(() => {});
          };
          img.onerror = done;
          img.src = frameUrl(n);
        });

      let cancelled = false;
      (async () => {
        // Frames 1-20 up front (phase C starts needing early frames quickly).
        for (let n = 1; n <= 20 && !cancelled; n++) {
          await loadFrame(n);
        }
        // Remaining frames lazily, one at a time, without blocking scroll/render.
        for (let n = 21; n <= FRAME_COUNT && !cancelled; n++) {
          await loadFrame(n);
        }
      })();

      // --- Canvas sizing (contain-fit, DPR-aware) ---------------------------
      const FRAME_ASPECT = 1440 / 810;
      let stageW = 0;
      let stageH = 0;
      // Contain-fitted frame box inside the stage (shared by canvas drawing and
      // wheel-img placement so both use identical geometry).
      let drawW = 0;
      let drawH = 0;
      let drawX = 0;
      let drawY = 0;
      let wheelSidePx = 0;

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

        if (stageW / stageH > FRAME_ASPECT) {
          drawH = stageH;
          drawW = drawH * FRAME_ASPECT;
        } else {
          drawW = stageW;
          drawH = drawW / FRAME_ASPECT;
        }
        drawX = (stageW - drawW) / 2;
        drawY = (stageH - drawH) / 2;

        wheelSidePx = drawW * WHEEL_IMG_SIDE_FRACTION_OF_DRAW_W;
        wheel!.style.width = `${wheelSidePx}px`;
        wheel!.style.height = `${wheelSidePx}px`;
        // Place the img so that, combined with yPercent:-50, the img CENTER sits where
        // the wheel circle center must be, corrected for the circle being slightly
        // above the img's own center (0.5 - 0.4881 of side).
        const circleCenterY = drawY + F001_CIRCLE_CENTER_Y_FRACTION * drawH;
        const imgCenterY = circleCenterY + (0.5 - CIRCLE_CENTER_Y_IN_WHEEL_IMG) * wheelSidePx;
        wheel!.style.top = `${imgCenterY}px`;

        drawCurrentFrame();
      }

      function nearestLoadedImage(): HTMLImageElement | null {
        // Prefer the requested frame; while it's still loading, hold the closest
        // earlier frame that IS loaded (per spec: "держать последний доступный").
        for (let i = Math.max(1, lastDrawnIndex); i >= 1; i--) {
          const im = images[i - 1];
          if (im) return im;
        }
        return images.find((im) => im !== null) ?? null;
      }

      function drawCurrentFrame() {
        if (!ctx || !stageW || !stageH) return;
        const img = nearestLoadedImage();
        if (!img) return;
        ctx.clearRect(0, 0, stageW, stageH);
        ctx.drawImage(img, drawX, drawY, drawW, drawH);
      }

      layoutStage();

      // --- rAF-deduped render, driven by ScrollTrigger progress -------------
      let rafId: number | null = null;
      let pendingProgress = 0;

      function frameForProgress(p: number) {
        if (p <= PHASE_D_START) {
          const local = (p - PHASE_B_END) / (PHASE_D_START - PHASE_B_END);
          return 1 + local * (95 - 1);
        }
        const local = (p - PHASE_D_START) / (1 - PHASE_D_START);
        return 95 + local * (100 - 95);
      }

      function render(p: number) {
        rafId = null;

        // The wheel falls at a VISIBLE spot near the left edge (center ≈ 18% of stage
        // width), then phase B rolls it from that same x to the center — the phases
        // share this value so there is no horizontal jump at the A/B boundary.
        // The roll distance is quantized so the total rotation is a multiple of 120°:
        // the wheel has 3 spokes, so the img then lands spoke-aligned with frame f001
        // and the img→canvas swap is seamless in rotation as well as position.
        const circleDiameter = wheelSidePx * CIRCLE_DIAMETER_FRACTION_OF_WHEEL_IMG;
        const spokeStep = (Math.PI * circleDiameter) / 3; // distance per 120° of roll
        const rollDistance = Math.max(1, Math.round((stageW * 0.32) / spokeStep)) * spokeStep;
        const rollStartX = -rollDistance;

        if (p < PHASE_A_END) {
          // Phase A: fall + bounce, in place (at the roll's start position).
          const localT = p / PHASE_A_END;
          const { y, rotate, scaleY } = sampleKeyframes(localT);
          // Fall from fully above the viewport down to the resting line.
          const fallDistancePx = stageH * 0.55 + wheelSidePx;
          gsap.set(wheel, {
            xPercent: -50,
            yPercent: -50,
            x: rollStartX,
            y: y * fallDistancePx,
            rotation: rotate,
            scaleY,
            scaleX: 1,
            opacity: 1,
          });
          gsap.set(canvas, { opacity: 0 });
          gsap.set(text, { opacity: 0, y: 24 }); // reset when scrubbing back from phase D
        } else if (p < PHASE_B_END) {
          // Phase B: roll left -> right; rotation = distance / (π·d) · 360 for a
          // no-slip roll, where d is the wheel CIRCLE's diameter (not the img side).
          const localT = (p - PHASE_A_END) / (PHASE_B_END - PHASE_A_END);
          const x = lerp(rollStartX, 0, localT);
          const distanceTravelled = x - rollStartX;
          const rotationDeg = (distanceTravelled / (Math.PI * circleDiameter)) * 360;
          gsap.set(wheel, {
            xPercent: -50,
            yPercent: -50,
            x,
            y: 0,
            rotation: rotationDeg,
            scaleX: 1,
            scaleY: 1,
            opacity: 1,
          });
          gsap.set(canvas, { opacity: 0 });
          gsap.set(text, { opacity: 0, y: 24 }); // reset when scrubbing back from phase D
        } else {
          // Phase C/D: canvas frame sequence + text fade in during the final 12%.
          gsap.set(wheel, { opacity: 0 });
          gsap.set(canvas, { opacity: 1 });

          const frameFloat = frameForProgress(p);
          const nextIndex = Math.min(FRAME_COUNT, Math.max(1, Math.round(frameFloat)));
          lastDrawnIndex = nextIndex;
          drawCurrentFrame();

          const textProgress = Math.min(1, Math.max(0, (p - PHASE_D_START) / (1 - PHASE_D_START)));
          gsap.set(text, {
            opacity: textProgress,
            y: (1 - textProgress) * 24,
          });
        }
      }

      function scheduleRender(p: number) {
        pendingProgress = p;
        if (rafId == null) {
          rafId = requestAnimationFrame(() => render(pendingProgress));
        }
      }
      // Rotation/squash pivot on the wheel CIRCLE's center (slightly above the img
      // center), so rolling doesn't wobble the circle around the img's midpoint.
      gsap.set(wheel, { transformOrigin: `50% ${CIRCLE_CENTER_Y_IN_WHEEL_IMG * 100}%` });

      // Initial paint, synchronous on purpose: rAF can be throttled/paused in hidden
      // tabs, and the very first state (wheel above the stage) must not wait for it.
      gsap.set(text, { opacity: 0, y: 24 });
      render(0);

      const isTouch = window.matchMedia("(pointer: coarse)").matches || window.innerWidth < 768;
      section.style.setProperty("--scene-height", isTouch ? "220vh" : "300vh");

      const trigger = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        scrub: 1,
        pin,
        onUpdate: (self) => scheduleRender(self.progress),
      });

      // Re-measure whenever the section's flow size changes. This both keeps the
      // canvas/wheel geometry in sync on viewport resizes and recovers from a
      // degenerate first measurement (e.g. the page mounted while the tab was
      // hidden/backgrounded with a 0x0 layout — ScrollTrigger would otherwise lock
      // that zero size onto the pin/spacer forever).
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
      <div ref={pinRef} className="relative h-screen w-full overflow-hidden bg-[#F5F1E6]">
        {/* Subtle radial blend so the frames' own cream background melts into the page. */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,var(--color-cream)_100%)]" />

        <div ref={stageRef} className="absolute inset-0">
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full"
            style={{ opacity: animated ? 0 : 1 }}
            aria-hidden
          />
          {!animated && (
            // Pre-hydration / reduced-motion / no-JS state: last frame, statically.
            <img
              ref={fallbackImgRef}
              src={LAST_FRAME}
              alt=""
              aria-hidden
              className="absolute inset-0 h-full w-full object-contain"
            />
          )}
          {animated && (
            <img
              ref={wheelRef}
              src="/anim/wheel.webp"
              alt=""
              aria-hidden
              // Positioned/centered entirely by GSAP (xPercent/yPercent -50 + x/y):
              // a CSS translate here would be overwritten by gsap.set's transform.
              // Starts invisible; render(0) places it before the first paint.
              className="absolute left-1/2"
              style={{ opacity: 0, willChange: "transform" }}
            />
          )}
        </div>

        <div
          ref={textRef}
          className="relative z-10 mx-auto flex h-full max-w-3xl flex-col items-center justify-end px-4 pb-16 text-center sm:pb-24"
          style={textHidden ? undefined : { opacity: 1 }}
        >
          <h1 className="mx-auto max-w-2xl text-3xl font-extrabold leading-tight text-ink sm:text-5xl">
            {title}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-ink/70 sm:text-lg">{subtitle}</p>
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
