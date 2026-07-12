"use client";

import { useEffect, useRef } from "react";

const MAX_PARTICLES = 120;
const SPAWN_PER_MOVE = 2;
const COLORS = ["#f5d7d7", "#cde8dd", "#e8927c"]; // blush, mint, accent

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number; // seconds remaining
  maxLife: number;
  color: string;
};

export default function CursorParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas!.width = Math.round(width * dpr);
      canvas!.height = Math.round(height * dpr);
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener("resize", resize, { passive: true });

    let particles: Particle[] = [];
    let rafId: number | null = null;
    let lastTime = performance.now();

    function spawn(x: number, y: number) {
      for (let i = 0; i < SPAWN_PER_MOVE; i++) {
        if (particles.length >= MAX_PARTICLES) particles.shift();
        const maxLife = 0.6 + Math.random() * 0.4; // 0.6 - 1s
        particles.push({
          x: x + (Math.random() - 0.5) * 6,
          y: y + (Math.random() - 0.5) * 6,
          vx: (Math.random() - 0.5) * 18,
          vy: -20 - Math.random() * 20, // drift upward
          size: 2 + Math.random() * 3,
          life: maxLife,
          maxLife,
          color: COLORS[(Math.random() * COLORS.length) | 0],
        });
      }
      ensureLoop();
    }

    function tick(now: number) {
      rafId = null;
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      ctx!.clearRect(0, 0, width, height);

      particles = particles.filter((p) => p.life > 0);
      for (const p of particles) {
        p.life -= dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 6 * dt; // gentle deceleration of the upward drift

        const t = Math.max(0, p.life / p.maxLife);
        ctx!.globalAlpha = t;
        ctx!.fillStyle = p.color;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.size * t, 0, Math.PI * 2);
        ctx!.fill();
      }
      ctx!.globalAlpha = 1;

      ensureLoop();
    }

    function ensureLoop() {
      if (rafId == null && particles.length > 0) {
        lastTime = performance.now();
        rafId = requestAnimationFrame(tick);
      }
    }

    function onPointerMove(e: PointerEvent) {
      spawn(e.clientX, e.clientY);
    }

    window.addEventListener("pointermove", onPointerMove, { passive: true });

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onPointerMove);
      if (rafId != null) cancelAnimationFrame(rafId);
      particles = [];
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-40"
    />
  );
}
