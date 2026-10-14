"use client";

import { useState } from "react";
import { Presence } from "@/components/presence/Presence";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { BREATH_PATTERNS, PHASE_LABELS } from "@/lib/breath/patterns";
import { useBreathCycle } from "@/lib/breath/useBreathCycle";
import type { Tone } from "@/lib/conversation/types";

export interface BreatheModeProps {
  tone?: Tone;
  onDone?: () => void;
  initialPatternId?: string;
}

/** The orb paces the breath. */
export function BreatheMode({ tone = "calm", onDone, initialPatternId = "calm" }: BreatheModeProps) {
  const [patternId, setPatternId] = useState(initialPatternId);
  const [haptics, setHaptics] = useState(true);
  const pattern = BREATH_PATTERNS.find((p) => p.id === patternId) ?? BREATH_PATTERNS[0];
  const sample = useBreathCycle(pattern, true, haptics);

  return (
    <section aria-label="Breathing exercise" className="flex h-full min-h-0 w-full flex-col items-center gap-3">
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <Presence state="idle" tone={tone} breath={sample.fullness} className="h-full max-h-[340px] w-auto max-w-[min(86vw,340px)]" />
      </div>

      <div role="status" aria-live="polite" className="flex flex-col items-center gap-0.5">
        <span className="voice-person text-[40px] leading-[1.1]">{PHASE_LABELS[sample.phase]}</span>
        <span className="text-[17px] text-muted tabular-nums" aria-hidden>
          {sample.remaining}
        </span>
      </div>

      <div role="radiogroup" aria-label="Pattern" className="mt-3 flex gap-1 rounded-pill border border-border bg-surface p-1 shadow-soft">
        {BREATH_PATTERNS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={p.id === patternId}
            aria-label={`${p.name}: ${p.description}`}
            onClick={() => setPatternId(p.id)}
            className={`min-h-11 rounded-pill px-4 text-[15px] transition-colors duration-[var(--motion-base)] ${
              p.id === patternId ? "bg-accent font-medium text-on-accent" : "text-text"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Switch checked={haptics} onChange={setHaptics} label="Haptics" hideLabel={false} />
        {onDone && (
          <Button variant="secondary" onClick={onDone} className="!shadow-none">
            Done
          </Button>
        )}
      </div>
    </section>
  );
}
