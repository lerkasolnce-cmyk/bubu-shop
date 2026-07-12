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

const INTRO_COUNT = 103;
const INTRO_DIR = "/anim/intro/";

function frameUrl(n: number) {
  return `${FRAME_DIR}f${String(n).padStart(3, "0")}.webp`;
}

function introUrl(n: number) {
  return `${INTRO_DIR}b${String(n).padStart(3, "0")}.webp`;
}

// Phase boundaries (fractions of total scroll progress through the pinned section).
// Story order (per owner's feedback): the baby plays with the wheel, the SAME wheel
// keeps rolling out of the vignette, and only then drops/settles at center stage.
const INTRO_END = 0.26; // baby plays with the wheel (intro frame sequence)
const ROLL_END = 0.46; // the wheel rolls in from the baby's side to center stage
const HOP_END = 0.58; // ...then hops up and falls onto its spot (bounce + squash)
const PHASE_D_START = 0.9; // last stretch: frames 96-100 + text fade-in
// The intro's last frame fades out over this fraction of the roll phase, quickly,
// so the rolling wheel never coexists with a ghost of the intro wheel.
const INTRO_FADE_PORTION = 0.15;
// The baby vignette is drawn smaller than the full stage (owner: baby was too big),
// bottom-anchored so the floor line stays put.
const INTRO_SCALE = 0.72;
// How much the assembled stroller shrinks upward while the headline fades in, so
// the text never overlaps the product (owner: captions must not overlap).
const TEXT_CLEARANCE_SCALE = 0.2;

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
// The hop starts ON the ground (the wheel just finished rolling), pops up, then
// falls back and settles — the "и потом падать" beat of the story.
const BOUNCE_KEYFRAMES: { t: number; y: number; rotate: number; scaleY: number }[] = [
  { t: 0, y: 0, rotate: 0, scaleY: 1 },
  { t: 0.08, y: 0, rotate: 0, scaleY: 0.9 }, // crouch before the hop
  { t: 0.34, y: -1, rotate: 6, scaleY: 1 }, // peak of the hop
  { t: 0.6, y: 0, rotate: 0, scaleY: 0.8 }, // the fall lands, big squash
  { t: 0.74, y: -0.22, rotate: -5, scaleY: 1 }, // small rebound
  { t: 0.86, y: 0, rotate: 0, scaleY: 0.92 }, // second, softer impact
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
  const shadowRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
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
      const shadow = shadowRef.current;
      const canvas = canvasRef.current;
      const text = textRef.current;
      const backdrop = backdropRef.current;
      if (!section || !pin || !stage || !wheel || !shadow || !canvas || !text || !backdrop) return;

      const ctx = canvas.getContext("2d");

      // --- Frame preloading -------------------------------------------------
      const images: (HTMLImageElement | null)[] = new Array(FRAME_COUNT).fill(null);
      const introImages: (HTMLImageElement | null)[] = new Array(INTRO_COUNT).fill(null);
      let lastDrawnIndex = 0; // 1-based assembly frame currently wanted on the canvas
      let lastIntroIndex = 1; // 1-based intro frame currently wanted on the canvas

      const loadInto = (store: (HTMLImageElement | null)[], n: number, url: string) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          let settled = false;
          const done = () => {
            if (settled) return;
            settled = true;
            store[n - 1] = img;
            // Repaint if this frame is at (or before) the one the canvas currently
            // wants: covers the very first paint (nothing was loaded when render(0)
            // ran) and "held" frames upgrading to the real one during slow loads.
            const wantsIt =
              (store === introImages && canvasMode === "intro" && n <= lastIntroIndex) ||
              (store === images && canvasMode === "assembly" && n <= lastDrawnIndex);
            if (wantsIt) drawCurrentFrame();
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
          img.src = url;
        });

      const loadFrame = (n: number) => loadInto(images, n, frameUrl(n));
      const loadIntro = (n: number) => loadInto(introImages, n, introUrl(n));

      let cancelled = false;
      (async () => {
        // The first paint shows intro frame 1 — fetch it before everything else,
        // then warm both sequences' opening stretches, then the long tails.
        for (let n = 1; n <= 10 && !cancelled; n++) {
          await loadIntro(n);
        }
        for (let n = 1; n <= 20 && !cancelled; n++) {
          await loadFrame(n);
        }
        for (let n = 11; n <= INTRO_COUNT && !cancelled; n++) {
          await loadIntro(n);
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

        // Ground shadow: a static ellipse on the floor line (the wheel img itself is a
        // clean shadow-free disc — see wheel-disc.webp — so the shadow must not rotate).
        const circleDiameterPx = wheelSidePx * CIRCLE_DIAMETER_FRACTION_OF_WHEEL_IMG;
        const groundY = circleCenterY + circleDiameterPx / 2;
        shadow!.style.width = `${circleDiameterPx * 0.95}px`;
        shadow!.style.height = `${circleDiameterPx * 0.14}px`;
        shadow!.style.top = `${groundY}px`;

        drawCurrentFrame();
      }

      function nearestLoaded(store: (HTMLImageElement | null)[], want: number): HTMLImageElement | null {
        // Prefer the requested frame; while it's still loading, hold the closest
        // earlier frame that IS loaded (per spec: "держать последний доступный").
        for (let i = Math.max(1, want); i >= 1; i--) {
          const im = store[i - 1];
          if (im) return im;
        }
        return store.find((im) => im !== null) ?? null;
      }

      // Which sequence the canvas is currently showing: the intro (baby) during the
      // opening phases, the assembly sequence from the hop handoff onward.
      let canvasMode: "intro" | "assembly" = "intro";
      // 0..1: how far the headline has faded in (phase D). The assembled stroller
      // shrinks toward the top edge by TEXT_CLEARANCE_SCALE·textClearance so the
      // text band at the bottom never overlaps the product.
      let textClearance = 0;

      function drawCurrentFrame() {
        if (!ctx || !stageW || !stageH) return;
        const img =
          canvasMode === "intro"
            ? nearestLoaded(introImages, lastIntroIndex)
            : nearestLoaded(images, lastDrawnIndex);
        if (!img) return;
        ctx.clearRect(0, 0, stageW, stageH);
        if (canvasMode === "intro") {
          // Smaller baby vignette, bottom-anchored so the floor line stays put.
          const w = drawW * INTRO_SCALE;
          const h = drawH * INTRO_SCALE;
          ctx.drawImage(img, drawX + (drawW - w) / 2, drawY + (drawH - h), w, h);
        } else {
          const s = 1 - TEXT_CLEARANCE_SCALE * textClearance;
          const w = drawW * s;
          const h = drawH * s;
          // Top-anchored: shrinking lifts the stroller away from the bottom text band.
          ctx.drawImage(img, drawX + (drawW - w) / 2, drawY, w, h);
        }
      }

      layoutStage();

      // --- rAF-deduped render, driven by ScrollTrigger progress -------------
      let rafId: number | null = null;
      let pendingProgress = 0;

      function frameForProgress(p: number) {
        if (p <= PHASE_D_START) {
          const local = (p - HOP_END) / (PHASE_D_START - HOP_END);
          return 1 + local * (95 - 1);
        }
        const local = (p - PHASE_D_START) / (1 - PHASE_D_START);
        return 95 + local * (100 - 95);
      }

      function render(p: number) {
        rafId = null;

        // The wheel enters rolling from the left (the baby's side of the vignette)
        // and travels to center stage. The roll distance is quantized so the total
        // rotation is a multiple of 120°: the wheel has 3 spokes, so it lands
        // spoke-aligned with frame f001 and the img→canvas swap after the hop is
        // seamless in rotation as well as position.
        const circleDiameter = wheelSidePx * CIRCLE_DIAMETER_FRACTION_OF_WHEEL_IMG;
        const spokeStep = (Math.PI * circleDiameter) / 3; // distance per 120° of roll
        const rollDistance = Math.max(1, Math.round((stageW * 0.32) / spokeStep)) * spokeStep;
        const rollStartX = -rollDistance;

        if (p < INTRO_END) {
          // Intro: the baby plays with the wheel (scrubbed frame sequence).
          canvasMode = "intro";
          const localT = p / INTRO_END;
          lastIntroIndex = Math.min(INTRO_COUNT, Math.max(1, Math.round(1 + localT * (INTRO_COUNT - 1))));
          drawCurrentFrame();
          gsap.set(canvas, { opacity: 1 });
          gsap.set(wheel, { opacity: 0 });
          gsap.set(shadow, { opacity: 0 });
          gsap.set(text, { opacity: 0, y: 24 });
          gsap.set(backdrop, { opacity: 0 });
        } else if (p < ROLL_END) {
          // Roll: the SAME wheel continues out of the baby vignette, rolling from
          // the left to center stage. Rotation = distance / (π·d) · 360 (no slip).
          // The intro's last frame fades out fast underneath — no lingering ghost.
          const localT = (p - INTRO_END) / (ROLL_END - INTRO_END);
          canvasMode = "intro";
          lastIntroIndex = INTRO_COUNT;
          drawCurrentFrame();
          gsap.set(canvas, { opacity: 1 - Math.min(1, localT / INTRO_FADE_PORTION) });
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
          gsap.set(shadow, { xPercent: -50, yPercent: -50, x, opacity: 0.35, scaleX: 1, scaleY: 1 });
          gsap.set(text, { opacity: 0, y: 24 }); // reset when scrubbing back from phase D
          gsap.set(backdrop, { opacity: 0 });
        } else if (p < HOP_END) {
          // Hop/fall: at center stage the wheel pops up and falls onto its spot
          // (crouch → hop → landing squash → settle), staying at x = 0 so it ends
          // exactly matching frame f001's wheel.
          const localT = (p - ROLL_END) / (HOP_END - ROLL_END);
          const { y, rotate, scaleY } = sampleKeyframes(localT);
          const hopHeightPx = stageH * 0.26;
          gsap.set(canvas, { opacity: 0 });
          gsap.set(wheel, {
            xPercent: -50,
            yPercent: -50,
            x: 0,
            y: y * hopHeightPx,
            rotation: rotate,
            scaleY,
            scaleX: 1,
            opacity: 1,
          });
          // The shadow lightens while the wheel is airborne (y goes 0 → -1 → 0) and
          // widens with the impact squash; it does NOT rotate with the wheel.
          gsap.set(shadow, {
            xPercent: -50,
            yPercent: -50,
            x: 0,
            opacity: 0.35 * (1 + y * 0.8), // y is negative while airborne
            scaleX: 1 + (1 - scaleY) * 1.4,
            scaleY: 1,
          });
          gsap.set(text, { opacity: 0, y: 24 }); // reset when scrubbing back from phase D
          gsap.set(backdrop, { opacity: 0 });
        } else {
          // Phase C/D: canvas frame sequence + text fade in during the final stretch.
          // The assembly frames carry their own baked-in ground shadow, so the
          // synthetic ellipse hands off to them here.
          canvasMode = "assembly";
          gsap.set(wheel, { opacity: 0 });
          gsap.set(shadow, { opacity: 0 });
          gsap.set(canvas, { opacity: 1 });

          const textProgress = Math.min(1, Math.max(0, (p - PHASE_D_START) / (1 - PHASE_D_START)));
          textClearance = textProgress;

          const frameFloat = frameForProgress(p);
          const nextIndex = Math.min(FRAME_COUNT, Math.max(1, Math.round(frameFloat)));
          lastDrawnIndex = nextIndex;
          drawCurrentFrame();

          gsap.set(text, {
            opacity: textProgress,
            y: (1 - textProgress) * 24,
          });
          gsap.set(backdrop, { opacity: textProgress });
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
      // Longer pin than the original scene: the baby intro adds a phase.
      section.style.setProperty("--scene-height", isTouch ? "300vh" : "380vh");

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
            <>
              {/* Static ground shadow for the falling/rolling wheel: the disc asset has
                  no baked shadow (it would rotate along), so the floor contact lives
                  in this separate non-rotating ellipse. */}
              <div
                ref={shadowRef}
                aria-hidden
                className="absolute left-1/2 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(74,59,50,0.55)_0%,transparent_70%)] blur-[2px]"
                style={{ opacity: 0 }}
              />
              <img
                ref={wheelRef}
                src="/anim/wheel-disc.webp"
                alt=""
                aria-hidden
                // Positioned/centered entirely by GSAP (xPercent/yPercent -50 + x/y):
                // a CSS translate here would be overwritten by gsap.set's transform.
                // Starts invisible; render(0) places it before the first paint.
                className="absolute left-1/2"
                style={{ opacity: 0, willChange: "transform" }}
              />
            </>
          )}
        </div>

        {/* Legibility backdrop: a soft cream gradient behind the bottom text band,
            fading in together with the headline (phase D). */}
        <div
          ref={backdropRef}
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-cream via-cream/70 to-transparent"
          style={{ opacity: textHidden ? 0 : 1 }}
        />
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
