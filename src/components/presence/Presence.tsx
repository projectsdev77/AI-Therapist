"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { PresenceState, Tone } from "@/lib/conversation/types";
import { mixRGB, parseColor, readMs, readToken, toneToken, type RGB } from "@/lib/design/tokens";
import { FRAGMENT_SHADER, VERTEX_SHADER } from "./shader";

export interface PresenceProps {
  state: PresenceState;
  tone?: Tone;
  /** Live audio level 0..1 (mic while listening, TTS while speaking). Polled every frame. */
  getLevel?: () => number;
  /** Breath fullness 0..1. When set, overrides the orb's size (Breathe mode). */
  breath?: number | null;
  className?: string;
}

interface Params {
  scale: number;
  wobble: number;
  swirl: number;
  ripple: number;
  glow: number;
  breathAmp: number;
  breathPeriod: number;
}

/** Motion character of each state. Tuned to feel unhurried. */
export const PRESENCE_STATES: Record<PresenceState, Params> = {
  idle: { scale: 1, wobble: 0.022, swirl: 0.12, ripple: 0, glow: 1, breathAmp: 0.04, breathPeriod: 10 },
  listening: { scale: 1.05, wobble: 0.032, swirl: 0.18, ripple: 1, glow: 1.15, breathAmp: 0.015, breathPeriod: 10 },
  thinking: { scale: 0.9, wobble: 0.018, swirl: 0.9, ripple: 0, glow: 0.9, breathAmp: 0.02, breathPeriod: 6 },
  speaking: { scale: 1.02, wobble: 0.03, swirl: 0.25, ripple: 0.6, glow: 1.2, breathAmp: 0.01, breathPeriod: 10 },
  concerned: { scale: 0.97, wobble: 0.01, swirl: 0.05, ripple: 0, glow: 1.1, breathAmp: 0.03, breathPeriod: 12 },
};

const STATE_LABELS: Record<PresenceState, string> = {
  idle: "resting",
  listening: "listening",
  thinking: "thinking",
  speaking: "speaking",
  concerned: "here with you",
};

function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}

function usePrefersReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn("Presence shader failed:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function Presence({ state, tone = "neutral", getLevel, breath = null, className = "" }: PresenceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const propsRef = useRef({ state, tone, getLevel, breath });
  const [webglFailed, setWebglFailed] = useState(false);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    propsRef.current = { state, tone, getLevel, breath };
  });

  useEffect(() => {
    if (reducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { premultipliedAlpha: true, antialias: true, alpha: true });
    if (!gl) {
      setWebglFailed(true);
      return;
    }

    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    const program = gl.createProgram();
    if (!vs || !fs || !program) {
      setWebglFailed(true);
      return;
    }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setWebglFailed(true);
      return;
    }
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const u = (name: string) => gl.getUniformLocation(program, name);
    const uni = {
      res: u("u_res"),
      time: u("u_time"),
      color: u("u_color"),
      accent: u("u_accent"),
      scale: u("u_scale"),
      wobble: u("u_wobble"),
      swirl: u("u_swirl"),
      level: u("u_level"),
      ripple: u("u_ripple"),
      glow: u("u_glow"),
    };

    // Colors come from design tokens and are re-read when the theme changes.
    let accent: RGB = [1, 1, 1];
    let toneShiftMs = 4000;
    const toneColors = new Map<string, RGB>();
    const readColors = () => {
      accent = parseColor(readToken("--color-accent-strong"));
      toneShiftMs = readMs("--motion-tone-shift", 4000);
      toneColors.clear();
    };
    const colorFor = (key: Tone | "concerned"): RGB => {
      let c = toneColors.get(key);
      if (!c) {
        c = parseColor(readToken(toneToken(key)));
        toneColors.set(key, c);
      }
      return c;
    };
    readColors();
    const themeObserver = new MutationObserver(readColors);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const schemeMq = window.matchMedia("(prefers-color-scheme: dark)");
    schemeMq.addEventListener("change", readColors);

    const initial = propsRef.current;
    let color: RGB = colorFor(initial.state === "concerned" ? "concerned" : initial.tone);
    const p: Params = { ...PRESENCE_STATES[initial.state] };
    let level = 0;
    let breathScale = 1;
    let last = performance.now();
    const start = last;
    let frame = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    const render = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const t = (now - start) / 1000;
      const cur = propsRef.current;
      const target = PRESENCE_STATES[cur.state];

      // Ease parameters toward the state's target.
      const k = 1 - Math.exp(-dt * 2.5);
      (Object.keys(p) as (keyof Params)[]).forEach((key) => {
        p[key] += (target[key] - p[key]) * k;
      });

      // Tone color drifts slowly so it never flickers.
      const targetColor = colorFor(cur.state === "concerned" ? "concerned" : cur.tone);
      color = mixRGB(color, targetColor, 1 - Math.exp(-dt / (toneShiftMs / 1000 / 3)));

      // Audio level: quick attack, slow release.
      const raw = Math.max(0, Math.min(1, cur.getLevel?.() ?? 0));
      level += (raw - level) * (raw > level ? 1 - Math.exp(-dt * 18) : 1 - Math.exp(-dt * 4));

      const idleBreath = 1 + p.breathAmp * Math.sin((2 * Math.PI * t) / p.breathPeriod);
      const targetBreath = cur.breath == null ? idleBreath : 0.78 + 0.38 * cur.breath;
      breathScale += (targetBreath - breathScale) * (1 - Math.exp(-dt * 6));

      resize();
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uni.res, canvas.width, canvas.height);
      gl.uniform1f(uni.time, t);
      gl.uniform3f(uni.color, color[0], color[1], color[2]);
      gl.uniform3f(uni.accent, accent[0], accent[1], accent[2]);
      gl.uniform1f(uni.scale, p.scale * breathScale);
      gl.uniform1f(uni.wobble, p.wobble);
      gl.uniform1f(uni.swirl, p.swirl);
      gl.uniform1f(uni.level, level);
      gl.uniform1f(uni.ripple, p.ripple);
      gl.uniform1f(uni.glow, p.glow);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(frame);
      themeObserver.disconnect();
      schemeMq.removeEventListener("change", readColors);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      gl.deleteBuffer(buffer);
    };
  }, [reducedMotion]);

  const label = `Companion is ${STATE_LABELS[state]}`;

  if (reducedMotion || webglFailed) {
    const colorVar = `var(${toneToken(state === "concerned" ? "concerned" : tone)})`;
    const scale = breath == null ? PRESENCE_STATES[state].scale : 0.78 + 0.38 * breath;
    return (
      <div role="img" aria-label={label} className={`relative aspect-square ${className}`} data-presence-state={state}>
        <div
          className="absolute inset-[22%] rounded-full"
          style={{
            background: `radial-gradient(circle at 38% 34%, color-mix(in oklab, ${colorVar} 70%, white), ${colorVar} 55%, color-mix(in oklab, ${colorVar} 70%, black))`,
            boxShadow: `0 0 80px 10px color-mix(in oklab, ${colorVar} 45%, transparent)`,
            transform: `scale(${scale})`,
            transition: "background var(--motion-tone-shift) var(--ease-calm), transform 1s var(--ease-breath)",
          }}
        />
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={label}
      data-presence-state={state}
      className={`block aspect-square ${className}`}
    />
  );
}
