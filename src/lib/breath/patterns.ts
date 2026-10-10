export type BreathPhase = "in" | "hold-in" | "out" | "hold-out";

export interface BreathPattern {
  id: string;
  name: string;
  description: string;
  /** Seconds per phase. A 0 skips the phase. */
  phases: Record<BreathPhase, number>;
}

export const BREATH_PATTERNS: BreathPattern[] = [
  {
    id: "box",
    name: "Box breathing",
    description: "In 4 · hold 4 · out 4 · hold 4",
    phases: { in: 4, "hold-in": 4, out: 4, "hold-out": 4 },
  },
  {
    id: "478",
    name: "4-7-8",
    description: "In 4 · hold 7 · out 8",
    phases: { in: 4, "hold-in": 7, out: 8, "hold-out": 0 },
  },
  {
    id: "calm",
    name: "Slow exhale",
    description: "In 4 · out 6",
    phases: { in: 4, "hold-in": 0, out: 6, "hold-out": 0 },
  },
];

const ORDER: BreathPhase[] = ["in", "hold-in", "out", "hold-out"];

export const PHASE_LABELS: Record<BreathPhase, string> = {
  in: "Breathe in",
  "hold-in": "Hold",
  out: "Breathe out",
  "hold-out": "Hold",
};

export function cycleLength(pattern: BreathPattern): number {
  return ORDER.reduce((sum, p) => sum + pattern.phases[p], 0);
}

export interface BreathSample {
  phase: BreathPhase;
  /** 0..1 progress through the current phase. */
  progress: number;
  /** Seconds remaining in the current phase (ceil, for display). */
  remaining: number;
  /** 0 = fully exhaled, 1 = fully inhaled. Eased. */
  fullness: number;
}

const ease = (t: number) => 0.5 - Math.cos(Math.PI * t) / 2;

/** Pure: where in the breath cycle are we after `elapsed` seconds? */
export function sampleBreath(pattern: BreathPattern, elapsed: number): BreathSample {
  const total = cycleLength(pattern);
  let t = ((elapsed % total) + total) % total;
  for (const phase of ORDER) {
    const len = pattern.phases[phase];
    if (len <= 0) continue;
    if (t < len) {
      const progress = t / len;
      const fullness =
        phase === "in" ? ease(progress) : phase === "out" ? 1 - ease(progress) : phase === "hold-in" ? 1 : 0;
      return { phase, progress, remaining: Math.ceil(len - t), fullness };
    }
    t -= len;
  }
  return { phase: "in", progress: 0, remaining: pattern.phases.in, fullness: 0 };
}
