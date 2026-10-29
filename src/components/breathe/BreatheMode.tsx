"use client";

import { useState, useSyncExternalStore } from "react";
import { Presence } from "@/components/presence/Presence";
import { Button } from "@/components/ui/Button";
import { Switch } from "@/components/ui/Switch";
import { BREATH_PATTERNS, PHASE_LABELS } from "@/lib/breath/patterns";
import { useBreathCycle } from "@/lib/breath/useBreathCycle";
import { BackIcon } from "@/components/ui/icons";
import { useIsWide } from "@/lib/useIsDesktop";

export interface BreatheModeProps {
  onDone?: () => void;
  initialPatternId?: string;
  /** Desktop header button ("Back to conversation" inside a conversation). */
  backLabel?: string;
  /** Always the simple centred layout (inside a conversation). */
  simple?: boolean;
}

const noop = () => () => {};
const canVibrate = () => typeof navigator !== "undefined" && "vibrate" in navigator;

/** The orb paces the breath (README "breathe"): phase, count and round, pattern, vibration, I'm done. */
export function BreatheMode({ onDone, initialPatternId = "calm", backLabel = "Back", simple = false }: BreatheModeProps) {
  const [patternId, setPatternId] = useState(initialPatternId);
  const [haptics, setHaptics] = useState(true);
  const [sound, setSound] = useState(true);
  const vibrates = useSyncExternalStore(noop, canVibrate, () => false);
  const wide = useIsWide() && !simple;
  const pattern = BREATH_PATTERNS.find((p) => p.id === patternId) ?? BREATH_PATTERNS[0];
  const sample = useBreathCycle(pattern, true, haptics && vibrates && !wide, sound && wide);

  if (wide) {
    // Desktop handoff "breathe": the orb at full size, the pattern and sound to the side.
    return (
      <section aria-label="Breathing exercise" className="flex min-h-0 flex-1 flex-col">
        <header className="relative flex shrink-0 items-center gap-3 border-b border-edge-lo px-7 py-3.5">
          {onDone && (
            <button type="button" onClick={onDone} className="press flex min-h-10 items-center gap-1 rounded-pill pr-3.5 pl-2 text-[14px] text-text hover:bg-glass">
              <BackIcon size={18} />
              {backLabel}
            </button>
          )}
          <span className="flex-1" />
          <span className="text-[13px] text-faint">
            <kbd className="font-mono">Esc</kbd> to leave
          </span>
        </header>
        <div className="relative mx-auto grid min-h-0 w-full max-w-[1080px] flex-1 grid-cols-[minmax(0,1fr)_360px] items-center gap-12 px-16 py-6">
          <div className="flex flex-col items-center gap-[18px] text-center">
            <Presence state="breathing" size={300} breath={sample.fullness} />
            <div role="status" aria-live="polite" className="flex flex-col gap-0.5">
              <span className="text-[44px] font-semibold tracking-[-0.035em]">{PHASE_LABELS[sample.phase]}</span>
              <span className="text-[17px] text-muted tabular-nums">
                {sample.count} of {sample.length} · round {sample.round}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-3.5">
            <h2 id="breath-pattern" className="m-0 text-[12px] font-semibold tracking-[.06em] text-faint uppercase">
              Pattern
            </h2>
            <div role="radiogroup" aria-labelledby="breath-pattern" className="flex flex-col gap-1.5">
              {BREATH_PATTERNS.map((p) => {
                const on = p.id === patternId;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setPatternId(p.id)}
                    className={`press flex min-h-14 items-center gap-3 rounded-md border px-4 text-left text-text ${
                      on ? "border-[rgba(143,240,232,.5)] bg-glass-strong" : "border-edge-lo bg-glass hover:bg-glass-strong"
                    }`}
                  >
                    <span aria-hidden className={`size-[18px] shrink-0 rounded-full ${on ? "border-[5px] border-mic bg-mic-fg" : "border-[1.5px] border-faint"}`} />
                    <span className={`flex-1 text-base ${on ? "font-semibold" : ""}`}>{p.name}</span>
                    <span className="text-[13px] text-muted">{p.description}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex min-h-14 items-center gap-3 rounded-md border border-edge-lo bg-glass pr-1.5 pl-4">
              <span className="flex-1 text-[15px]">Soft sound on each step</span>
              <Switch checked={sound} onChange={setSound} label="Soft sound on each step" />
            </div>
            {onDone && (
              <Button variant="secondary" onClick={onDone} className="mt-1.5 min-h-[52px] text-base font-semibold">
                I&apos;m done
              </Button>
            )}
          </div>
        </div>
      </section>
    );
  }

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
