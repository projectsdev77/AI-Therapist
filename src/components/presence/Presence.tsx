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
  /** Breath fullness 0..1. When set, the orb paces the breath (the "breath" state). */
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
  /** How far the outer two membranes spread from the core. */
  spread: number;
  /** How strongly the orb reacts to audio level. */
  levelGain: number;
}

type MotionState = PresenceState | "breath";

/** Motion character of each state (designer's table, docs/design-handoff/from-designer/HANDOFF.md §5). */
export const PRESENCE_STATES: Record<MotionState, Params> = {
  idle: { scale: 1.0, wobble: 0.05, swirl: 0.6, ripple: 0.0, glow: 1.0, breathAmp: 0.035, breathPeriod: 10, spread: 1.0, levelGain: 0.0 },
  listening: { scale: 1.04, wobble: 0.06, swirl: 0.7, ripple: 0.8, glow: 1.1, breathAmp: 0.015, breathPeriod: 10, spread: 1.08, levelGain: 0.9 },
  thinking: { scale: 0.92, wobble: 0.035, swirl: 1.6, ripple: 0.0, glow: 0.9, breathAmp: 0.02, breathPeriod: 6, spread: 0.9, levelGain: 0.0 },
  speaking: { scale: 1.02, wobble: 0.055, swirl: 0.8, ripple: 0.6, glow: 1.15, breathAmp: 0.01, breathPeriod: 10, spread: 1.1, levelGain: 1.0 },
  concerned: { scale: 0.97, wobble: 0.02, swirl: 0.3, ripple: 0.0, glow: 1.2, breathAmp: 0.03, breathPeriod: 12, spread: 1.15, levelGain: 0.3 },
  breath: { scale: 1.0, wobble: 0.025, swirl: 0.4, ripple: 0.0, glow: 1.05, breathAmp: 0.0, breathPeriod: 10, spread: 1.05, levelGain: 0.0 },
};

const STATE_LABELS: Record<MotionState, string> = {
  idle: "resting",
  listening: "listening",
  thinking: "thinking",
  speaking: "speaking",
  concerned: "here with you",
  breath: "breathing with you",
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
  const motionState: MotionState = breath == null ? state : "breath";

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
      phase: u("u_phase"),
      radius: u("u_radius"),
      wobble: u("u_wobble"),
      ripple: u("u_ripple"),
      level: u("u_level"),
      spread: u("u_spread"),
      glowAmt: u("u_glowAmt"),
      screen: u("u_screen"),
      tone: u("u_tone"),
      core: u("u_core"),
      membrane: u("u_membrane"),
    };

    // Colors and blend come from design tokens and are re-read when the theme changes.
    let core: RGB = [1, 1, 1];
    let membrane: RGB = [1, 1, 1];
    let glowAlpha = 0.1;
    let screen = 1;
    let toneShiftMs = 4000;
    const toneColors = new Map<string, RGB>();
    const readColors = () => {
      const el = canvas;
      core = parseColor(readToken("--orb-core", el));
      membrane = parseColor(readToken("--orb-membrane", el));
      glowAlpha = parseFloat(readToken("--orb-glow-alpha", el)) || 0.1;
      screen = readToken("--orb-blend", el) === "source-over" ? 0 : 1;
      toneShiftMs = readMs("--motion-tone-shift", 4000);
      toneColors.clear();
    };
    const colorFor = (key: Tone | "concerned"): RGB => {
      let c = toneColors.get(key);
      if (!c) {
        c = parseColor(readToken(toneToken(key), canvas));
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
    const initialState: MotionState = initial.breath == null ? initial.state : "breath";
    let color: RGB = colorFor(initialState === "concerned" ? "concerned" : initial.tone);
    const p: Params = { ...PRESENCE_STATES[initialState] };
    let level = 0;
    let breathScale = 1;
    let phase = 0;
    let breathPhase = 0;
    let last = performance.now();
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
      const cur = propsRef.current;
      const st: MotionState = cur.breath == null ? cur.state : "breath";
      const target = PRESENCE_STATES[st];

      // Every parameter eases toward its target (≈1.2s to 95%), so states never pop.
      const k = 1 - Math.exp(-dt * 2.5);
      (Object.keys(p) as (keyof Params)[]).forEach((key) => {
        p[key] += (target[key] - p[key]) * k;
      });
      // Accumulated phases keep motion continuous when swirl or period changes.
      phase += dt * p.swirl;
      breathPhase += (dt * 2 * Math.PI) / p.breathPeriod;

      // Tone color drifts slowly so it never flickers.
      const targetColor = colorFor(st === "concerned" ? "concerned" : cur.tone);
      color = mixRGB(color, targetColor, 1 - Math.exp(-dt / (toneShiftMs / 1000 / 3)));

      // Audio level: fast attack, slow release, scaled by the state's level gain.
      const raw = Math.max(0, Math.min(1, cur.getLevel?.() ?? 0)) * p.levelGain;
      level += (raw - level) * (raw > level ? 1 - Math.exp(-dt * 18) : 1 - Math.exp(-dt * 4));

      const targetBreath = cur.breath == null ? 1 + p.breathAmp * Math.sin(breathPhase) : 0.78 + 0.38 * cur.breath;
      breathScale += (targetBreath - breathScale) * (1 - Math.exp(-dt * 6));

      resize();
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(uni.res, canvas.width, canvas.height);
      gl.uniform1f(uni.phase, phase);
      gl.uniform1f(uni.radius, 0.27 * p.scale * breathScale * (1 + 0.05 * level));
      gl.uniform1f(uni.wobble, p.wobble + level * 0.04);
      gl.uniform1f(uni.ripple, p.ripple);
      gl.uniform1f(uni.level, level);
      gl.uniform1f(uni.spread, p.spread);
      gl.uniform1f(uni.glowAmt, glowAlpha * p.glow * (1 + 0.5 * level));
      gl.uniform1f(uni.screen, screen);
      gl.uniform3f(uni.tone, color[0], color[1], color[2]);
      gl.uniform3f(uni.core, core[0], core[1], core[2]);
      gl.uniform3f(uni.membrane, membrane[0], membrane[1], membrane[2]);
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

  const label = `Companion is ${STATE_LABELS[motionState]}`;

  if (reducedMotion || webglFailed) {
    // Static fallback: --orb-core → tone → transparent at 72%. Tone still cross-fades as color only.
    const toneVar = `var(${toneToken(state === "concerned" ? "concerned" : tone)})`;
    const scale = breath == null ? PRESENCE_STATES[state].scale : 0.78 + 0.38 * breath;
    return (
      <div role="img" aria-label={label} className={`relative aspect-square ${className}`} data-presence-state={state}>
        <div
          className="absolute inset-[8%] rounded-full"
          style={{
            background: `radial-gradient(circle at 42% 40%, var(--orb-core), ${toneVar} 46%, transparent 72%)`,
            transform: `scale(${scale})`,
            transition: "background var(--motion-tone-shift) var(--ease-calm)",
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
