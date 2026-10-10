"use client";

import { useState } from "react";
import { Presence } from "@/components/presence/Presence";
import { Button } from "@/components/ui/Button";
import { CloseIcon } from "@/components/ui/icons";
import { BREATH_PATTERNS, PHASE_LABELS } from "@/lib/breath/patterns";
import { useBreathCycle } from "@/lib/breath/useBreathCycle";
import type { Tone } from "@/lib/conversation/types";

export interface BreatheModeProps {
  tone?: Tone;
  onClose?: () => void;
  initialPatternId?: string;
}

/** The orb becomes a breath pacer. */
export function BreatheMode({ tone = "calm", onClose, initialPatternId = "box" }: BreatheModeProps) {
  const [patternId, setPatternId] = useState(initialPatternId);
  const [haptics, setHaptics] = useState(false);
  const pattern = BREATH_PATTERNS.find((p) => p.id === patternId) ?? BREATH_PATTERNS[0];
  const sample = useBreathCycle(pattern, true, haptics);

  return (
    <section aria-label="Breathing exercise" className="flex flex-col items-center gap-6 text-center">
      <div className="flex w-full items-center justify-between">
        <h2 className="font-display text-xl">Breathe</h2>
        {onClose && (
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close breathing exercise">
            <CloseIcon />
          </Button>
        )}
      </div>

      <Presence state="idle" tone={tone} breath={sample.fullness} className="w-[min(78vw,22rem)]" />

      <div aria-live="polite" className="min-h-16">
        <p className="font-display text-3xl">{PHASE_LABELS[sample.phase]}</p>
        <p className="mt-1 text-muted tabular-nums" aria-hidden>
          {sample.remaining}
        </p>
      </div>

      <div role="radiogroup" aria-label="Breathing pattern" className="flex flex-wrap justify-center gap-2">
        {BREATH_PATTERNS.map((p) => (
          <button
            key={p.id}
            role="radio"
            aria-checked={p.id === patternId}
            onClick={() => setPatternId(p.id)}
            className={`rounded-pill border px-4 py-2 text-sm transition-colors duration-300 ${
              p.id === patternId ? "border-accent bg-surface-strong text-text" : "border-border text-muted hover:text-text"
            }`}
          >
            <span className="block font-medium">{p.name}</span>
            <span className="block text-xs text-faint">{p.description}</span>
          </button>
        ))}
      </div>

      <label className="flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" checked={haptics} onChange={(e) => setHaptics(e.target.checked)} className="accent-[var(--color-accent)]" />
        Gentle vibration on each phase
      </label>
    </section>
  );
}
