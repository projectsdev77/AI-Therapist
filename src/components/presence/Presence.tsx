"use client";

import { useEffect, useRef } from "react";
import type { PresenceState } from "@/lib/conversation/types";
import { useIsDesktop } from "@/lib/useIsDesktop";

/**
 * The orb: a direct React port of the designer's haven-orb.js ("5f halo orb",
 * docs/design-handoff/from-designer-v2/haven-orb.js). DOM layers at a design size of
 * 230px, scaled to `size`. Three tilted conic rings, a round core with a moving shade and
 * rim light, and two eyes that turn with the orb. Pauses offscreen; static under reduced motion.
 */

const DESIGN = 230;
const MASK = "radial-gradient(circle, transparent 56%, #000 59%, #000 66%, transparent 69%)";
const R1 = "#6ff0e6, #3fd6cd 16%, #1aa8b5 30%, #4f7dff 46%, #b8a8ff 60%, #f0a8d8 72%, #a6f4ee 88%, #6ff0e6";
const R2 = "transparent 0 20%, #a6f4ee 35%, #8f9cff 50%, transparent 65%, #2a6fd0 82%, transparent";
const R3 = "transparent 0 40%, #dccfff 55%, #ffc4a8 64%, #6ff0e6 74%, transparent 85%";

/** Per-state targets: s = scale, k = ring speed, g = glow, pitch in deg, ey = eye lift px, eo = eye openness. */
const T: Record<PresenceState, { k: number; g: number; s: number; pitch: number; ey: number; eo: number }> = {
  idle: { k: 1, g: 1, s: 1, pitch: 0, ey: 0, eo: 1 },
  listening: { k: 1.25, g: 1.3, s: 1.03, pitch: -5, ey: 0, eo: 1 },
  thinking: { k: 0.6, g: 1, s: 0.98, pitch: 7, ey: -5, eo: 0.8 },
  speaking: { k: 1.8, g: 1.45, s: 1, pitch: 0, ey: 0, eo: 1 },
  breathing: { k: 0.7, g: 1, s: 1, pitch: 0, ey: 0, eo: 0.25 },
  concerned: { k: 0.45, g: 1.2, s: 0.97, pitch: -4, ey: 3, eo: 0.82 },
};

type Cur = { yaw: number; pitch: number; s: number; k: number; g: number; ey: number; eo: number };

function Ring({ inset, colors, dur, reverse, tilt, blur, opacity, z }: { inset: number; colors: string; dur: number; reverse?: boolean; tilt: string; blur: number; opacity: number; z: number }) {
  return (
    <div style={{ position: "absolute", inset, transform: `translateZ(${z}px) ${tilt}` }}>
      <div
        data-orb-spin
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background: `conic-gradient(${colors})`,
          filter: `blur(${blur}px)`,
          opacity,
          animation: `ho-spin ${dur}s linear infinite${reverse ? " reverse" : ""}`,
          WebkitMask: MASK,
          mask: MASK,
        }}
      />
    </div>
  );
}

const Eye = () => <span style={{ width: 12, height: 26, borderRadius: 6, background: "#fff", boxShadow: "0 0 10px rgba(255,255,255,.6)" }} />;

export interface PresenceProps {
  state: PresenceState;
  /** Size in px on phones. */
  size: number;
  /** Size in px at the desktop breakpoint (defaults to `size`). */
  desktopSize?: number;
  /**
   * Breathing only: breath fullness 0..1 from the pacer, so the orb follows the chosen
   * pattern. Without it, the orb uses the design's own 4s in / 6s out cycle.
   */
  breath?: number;
  className?: string;
}

export function Presence({ state, size, desktopSize, breath, className }: PresenceProps) {
  const desktop = useIsDesktop();
  const px = desktop && desktopSize ? desktopSize : size;
  const host = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const shineRef = useRef<HTMLDivElement>(null);
  const shadeRef = useRef<HTMLDivElement>(null);
  const rimRef = useRef<HTMLDivElement>(null);
  const ringsRef = useRef<HTMLDivElement>(null);
  const eyesRef = useRef<HTMLDivElement>(null);
  const lidsRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef(state);
  const breathRef = useRef(breath);
  useEffect(() => {
    stateRef.current = state;
    breathRef.current = breath;
  });

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cur: Cur = { yaw: 0, pitch: 0, s: 1, k: 1, g: 1, ey: 0, eo: 1 };
    const look = { yaw: 0, next: 2 };
    const t0 = performance.now();
    let anims: Animation[] = [];
    let visible = true;
    let raf = 0;

    const frame = (t: number) => {
      const st = stateRef.current;
      const tg: Cur = { ...T[st], yaw: 0 };
      // Yaw: idle looks around now and then; thinking drifts; speaking sways; listening and breathing face you.
      if (st === "idle") {
        if (t > look.next) {
          look.yaw = look.yaw ? 0 : (Math.random() < 0.5 ? -1 : 1) * (18 + Math.random() * 14);
          look.next = t + (look.yaw ? 1.8 : 4 + Math.random() * 4);
        }
        tg.yaw = look.yaw;
        tg.pitch = 2 * Math.sin(t * 0.4);
      } else if (st === "thinking") {
        tg.yaw = 14 * Math.sin(t * 0.45);
      } else if (st === "speaking") {
        const v = Math.abs(Math.sin(t * 7.3) * Math.sin(t * 2.9 + 1));
        tg.yaw = 8 * Math.sin(t * 0.9) + 3 * Math.sin(t * 2.3);
        tg.pitch = 2 * Math.sin(t * 1.7);
        tg.s = 1 + 0.04 * v;
        tg.g += 0.5 * v;
        tg.eo = 1 - 0.25 * v;
      } else if (st === "breathing") {
        let e: number;
        if (breathRef.current !== undefined) {
          e = breathRef.current;
        } else {
          const c = t % 10;
          const inh = c < 4 ? c / 4 : 1 - (c - 4) / 6;
          e = 0.5 - 0.5 * Math.cos(inh * Math.PI);
        }
        tg.s = 0.86 + 0.22 * e;
        tg.g = 0.8 + 0.7 * e;
        tg.eo = 0.2 + 0.8 * e;
      }
      const f = st === "speaking" || st === "breathing" ? 0.2 : 0.06;
      for (const k of Object.keys(cur) as (keyof Cur)[]) cur[k] += (tg[k] - cur[k]) * (k === "yaw" ? 0.045 : f);

      // A sphere never foreshortens: keep the core round, move what's ON it, and swing the rings in 3D.
      const yr = (cur.yaw * Math.PI) / 180;
      const pr = (cur.pitch * Math.PI) / 180;
      if (tiltRef.current) tiltRef.current.style.transform = `scale(${cur.s})`;
      if (ringsRef.current) ringsRef.current.style.transform = `perspective(520px) rotateY(${cur.yaw * 0.9}deg) rotateX(${cur.pitch * 0.8}deg)`;
      if (shineRef.current) shineRef.current.style.transform = `translate(${-Math.sin(yr) * 10}px, ${Math.sin(pr) * 8}px)`;
      if (shadeRef.current) shadeRef.current.style.transform = `translate(${-Math.sin(yr) * 34}px, ${Math.sin(pr) * 26}px)`;
      const rimA = Math.min(0.5, Math.abs(Math.sin(yr)) * 1.4);
      if (rimRef.current) rimRef.current.style.boxShadow = `inset ${Math.sign(cur.yaw) * -6}px 0 14px -4px rgba(143,240,232,${rimA.toFixed(3)})`;
      if (eyesRef.current)
        eyesRef.current.style.transform = `translate(${Math.sin(yr) * 48}px, ${cur.ey - Math.sin(pr) * 40}px) scaleX(${(0.55 + 0.45 * Math.cos(yr)).toFixed(3)})`;
      if (lidsRef.current) lidsRef.current.style.transform = `scaleY(${cur.eo})`;
      if (glowRef.current) glowRef.current.style.opacity = String(cur.g);
      if (!anims.length) anims = el.getAnimations({ subtree: true }).filter((a) => (a as CSSAnimation).animationName === "ho-spin");
      for (const a of anims) a.playbackRate = cur.k;
    };

    const loop = (now: number) => {
      frame((now - t0) / 1000);
      if (!reduce && visible) raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    let io: IntersectionObserver | undefined;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        el.getAnimations({ subtree: true }).forEach((a) => (visible ? a.play() : a.pause()));
        if (visible && !reduce) {
          cancelAnimationFrame(raf);
          raf = requestAnimationFrame(loop);
        }
      });
      io.observe(el);
    }
    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
    };
  }, []);

  return (
    <div ref={host} aria-hidden data-presence-state={state} className={className} style={{ position: "relative", width: px, height: px, flex: "none" }}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: DESIGN,
          height: DESIGN,
          margin: `-${DESIGN / 2}px 0 0 -${DESIGN / 2}px`,
          transform: `scale(${px / DESIGN})`,
        }}
      >
        <div style={{ position: "absolute", inset: 0, animation: "ho-float 8s ease-in-out infinite" }}>
          <div ref={tiltRef} style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d" }}>
            <div
              ref={glowRef}
              style={{ position: "absolute", inset: -24, borderRadius: "50%", background: "radial-gradient(circle, rgba(63,214,205,.22), transparent 66%)", filter: "blur(14px)" }}
            />
            <div
              style={{
                position: "absolute",
                inset: 34,
                borderRadius: "50%",
                overflow: "hidden",
                background: "radial-gradient(circle at 50% 42%, #1a8c84, #0b3c44 62%, #04141a 100%)",
                boxShadow: "inset 0 0 30px #04141a",
              }}
            >
              <div
                ref={shineRef}
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  background: "radial-gradient(circle at 34% 26%, rgba(255,255,255,.18), transparent 34%), radial-gradient(circle at 50% 108%, rgba(111,240,230,.24), transparent 46%)",
                }}
              />
              <div
                ref={shadeRef}
                style={{ position: "absolute", inset: "-20%", borderRadius: "50%", background: "radial-gradient(circle at 50% 50%, transparent 38%, rgba(2,10,14,.55) 62%)" }}
              />
              <div ref={rimRef} style={{ position: "absolute", inset: 0, borderRadius: "50%", boxShadow: "inset 0 0 0 0 rgba(143,240,232,0)" }} />
            </div>
            <div ref={ringsRef} style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d" }}>
              <Ring inset={4} colors={R1} dur={11} tilt="rotate(-12deg) scaleY(.92)" blur={3} opacity={0.95} z={14} />
              <Ring inset={0} colors={R2} dur={16} reverse tilt="rotate(24deg) scaleX(.9)" blur={5} opacity={0.8} z={-18} />
              <Ring inset={10} colors={R3} dur={8} tilt="rotate(70deg) scaleY(.82)" blur={2} opacity={0.7} z={6} />
            </div>
            <div ref={eyesRef} style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div ref={lidsRef} style={{ display: "flex", gap: 22 }}>
                <div style={{ display: "flex", gap: 22, animation: "ho-blink 6s ease-in-out infinite" }}>
                  <Eye />
                  <Eye />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
