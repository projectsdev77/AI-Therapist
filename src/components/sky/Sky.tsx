"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import type { Weather } from "@/lib/conversation/types";
import { readMs, readToken } from "@/lib/design/tokens";
import { drawSky, type SkyPalette, type SkyWeather } from "./skyRenderer";

export interface SkyProps {
  /** null = no sessions yet ("Quiet"). */
  weather: Weather | null;
  /**
   * "full": animated background filling its positioned parent.
   * "tile": one still canvas frame (reflection header, list thumbnails).
   * "swatch": just the gradient, for tiny grid cells.
   */
  variant?: "full" | "tile" | "swatch";
  className?: string;
  /** Offsets particle positions so neighboring tiles differ. */
  seed?: number;
}

function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function palette(el: Element, w: SkyWeather): SkyPalette {
  return {
    top: readToken(`--sky-${w}-top`, el) || "#181a16",
    bottom: readToken(`--sky-${w}-bottom`, el) || "#181a16",
    glow: readToken("--sky-glow", el) || "rgba(200,230,160,.16)",
    dark: getComputedStyle(el).colorScheme !== "light",
  };
}

export function Sky({ weather, variant = "full", className = "", seed = 0 }: SkyProps) {
  const active: SkyWeather = weather ?? "unknown";
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const weatherRef = useRef(active);
  const drawRef = useRef<((now: number) => void) | null>(null);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );

  useEffect(() => {
    weatherRef.current = active;
    // Still variants redraw when the weather changes; the animated loop picks it up itself.
    drawRef.current?.(performance.now());
  }, [active]);

  useEffect(() => {
    if (variant === "swatch") return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const animated = variant === "full" && !reducedMotion;
    const start = performance.now();
    let shown = weatherRef.current;
    let previous: SkyWeather | null = null;
    let fadeStart = 0;
    let fadeMs = 2400;
    let visible = true;
    let frame = 0;
    let palettes = new Map<SkyWeather, SkyPalette>();
    const paletteFor = (w: SkyWeather) => {
      let p = palettes.get(w);
      if (!p) {
        p = palette(canvas, w);
        palettes.set(w, p);
      }
      return p;
    };
    const refreshTheme = () => {
      palettes = new Map();
      fadeMs = readMs("--motion-sky", 2400);
      draw(performance.now());
    };

    const draw = (now: number) => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (!w || !h) return;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const target = weatherRef.current;
      if (target !== shown) {
        previous = shown;
        shown = target;
        fadeStart = now;
      }
      const t = animated ? (now - start) / 1000 : 0;
      const full = variant === "full";
      const k = previous && animated ? Math.min(1, (now - fadeStart) / fadeMs) : 1;
      // Ease the cross-fade with --ease-calm's shape.
      const eased = 1 - Math.pow(1 - k, 3);

      ctx.globalAlpha = 1;
      if (previous && eased < 1) {
        drawSky(ctx, w, h, paletteFor(previous), { weather: previous, t, full, seed });
        ctx.globalAlpha = eased;
      }
      drawSky(ctx, w, h, paletteFor(shown), { weather: shown, t, full, seed });
      ctx.globalAlpha = 1;
      if (eased >= 1) previous = null;
    };

    const loop = (now: number) => {
      if (visible && !document.hidden) draw(now);
      frame = requestAnimationFrame(loop);
    };

    fadeMs = readMs("--motion-sky", 2400);
    drawRef.current = draw;
    draw(performance.now());
    if (animated) frame = requestAnimationFrame(loop);

    const io = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? true;
    });
    io.observe(canvas);
    const ro = new ResizeObserver(() => draw(performance.now()));
    ro.observe(canvas);
    const themeObserver = new MutationObserver(refreshTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const schemeMq = window.matchMedia("(prefers-color-scheme: dark)");
    schemeMq.addEventListener("change", refreshTheme);

    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
      ro.disconnect();
      themeObserver.disconnect();
      schemeMq.removeEventListener("change", refreshTheme);
      drawRef.current = null;
    };
  }, [variant, reducedMotion, seed]);

  if (variant === "swatch") {
    return (
      <div
        aria-hidden
        className={className}
        style={{ background: `linear-gradient(to bottom, var(--sky-${active}-top), var(--sky-${active}-bottom))` }}
      />
    );
  }

  // The canvas is absolutely positioned so its pixel size can never feed back into layout.
  return (
    <div aria-hidden data-weather={active} className={`pointer-events-none ${variant === "full" ? "absolute inset-0" : "relative"} ${className}`}>
      <canvas ref={canvasRef} className="absolute inset-0 block h-full w-full" />
    </div>
  );
}
