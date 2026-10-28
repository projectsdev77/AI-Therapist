"use client";

import { useState, useSyncExternalStore } from "react";
import { Presence } from "@/components/presence/Presence";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { BREATH_PATTERNS, PHASE_LABELS } from "@/lib/breath/patterns";
import { useBreathCycle } from "@/lib/breath/useBreathCycle";

export interface BreatheModeProps {
  onDone?: () => void;
  initialPatternId?: string;
}

const noop = () => () => {};
const canVibrate = () => typeof navigator !== "undefined" && "vibrate" in navigator;

/** The orb paces the breath (README "breathe"): phase, count and round, pattern, vibration, I'm done. */
export function BreatheMode({ onDone, initialPatternId = "calm" }: BreatheModeProps) {
  const [patternId, setPatternId] = useState(initialPatternId);
  const [haptics, setHaptics] = useState(true);
  const vibrates = useSyncExternalStore(noop, canVibrate, () => false);
  const pattern = BREATH_PATTERNS.find((p) => p.id === patternId) ?? BREATH_PATTERNS[0];
  const sample = useBreathCycle(pattern, true, haptics && vibrates);

  return (
    <section aria-label="Breathing exercise" className="flex h-full min-h-0 w-full flex-col items-center px-5 text-center">
      <div className="flex min-h-0 flex-1 items-center justify-center">
        <Presence state="breathing" size={220} desktopSize={260} breath={sample.fullness} />
      </div>

      <div role="status" aria-live="polite" className="flex flex-col items-center gap-0.5">
        <span className="text-[clamp(30px,3.4vw,42px)] font-semibold tracking-[-0.035em]">{PHASE_LABELS[sample.phase]}</span>
        <span className="text-[17px] text-muted tabular-nums">
          {sample.count} of {sample.length} · round {sample.round}
        </span>
      </div>

      <div
        role="radiogroup"
        aria-label="Breathing pattern"
        className="mt-7 grid w-full max-w-[420px] grid-cols-3 gap-1 rounded-md border border-edge-hi bg-glass p-1"
      >
        {BREATH_PATTERNS.map((p) => {
          const on = p.id === patternId;
          return (
            <button
              key={p.id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setPatternId(p.id)}
              className={`press flex min-h-[52px] flex-col items-center justify-center rounded-sm leading-[1.2] ${on ? "bg-mic text-mic-fg" : "text-text hover:bg-glass"}`}
            >
              <span className="text-[15px] font-semibold">{p.name}</span>
              <span className="text-[12px] opacity-85">{p.description}</span>
            </button>
          );
        })}
      </div>

      {vibrates && (
        <div className="mt-3 flex min-h-[52px] w-full max-w-[420px] items-center gap-3 rounded-md border border-edge-lo bg-glass py-1 pr-1 pl-4">
          <span className="flex-1 text-left text-[15px]">Gentle vibration on each step</span>
          <Switch checked={haptics} onChange={setHaptics} label="Vibration" />
        </div>
      )}

      {onDone && (
        <Button variant="secondary" onClick={onDone} className="mt-5 mb-8 min-h-[52px] px-8 text-base font-semibold">
          I&apos;m done
        </Button>
      )}
    </section>
  );
}
