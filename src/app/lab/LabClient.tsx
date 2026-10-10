"use client";

import { useCallback, useEffect, useState } from "react";
import { BreatheMode } from "@/components/breathe/BreatheMode";
import { Captions, type CaptionLine } from "@/components/captions/Captions";
import { Presence } from "@/components/presence/Presence";
import { Sky } from "@/components/sky/Sky";
import { Button } from "@/components/ui/Button";
import { TONES, WEATHERS, type PresenceState, type Tone, type Weather } from "@/lib/conversation/types";

const STATES: PresenceState[] = ["idle", "listening", "thinking", "speaking", "concerned"];

const SCRIPT: CaptionLine[] = [
  { id: "1", speaker: "companion", text: "What's on your mind today?" },
  { id: "2", speaker: "user", text: "Work has been a lot this week. I can't switch off." },
  { id: "3", speaker: "companion", text: "That sounds exhausting. What does 'can't switch off' feel like at night?" },
  { id: "4", speaker: "user", text: "Mostly replaying conversations I had during the day." },
  { id: "5", speaker: "companion", text: "So your mind keeps working the day over, even after you've left it." },
];

function Chips<T extends string>({ label, values, value, onChange }: { label: string; values: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <fieldset className="flex flex-wrap items-center gap-2">
      <legend className="mb-1 w-full text-xs uppercase tracking-widest text-faint">{label}</legend>
      {values.map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          aria-pressed={v === value}
          className={`rounded-pill border px-3 py-1 text-sm ${v === value ? "border-accent bg-surface-strong" : "border-border text-muted"}`}
        >
          {v}
        </button>
      ))}
    </fieldset>
  );
}

/** Living style guide: every visual state on one page, for design review. */
export function LabClient() {
  const [state, setState] = useState<PresenceState>("idle");
  const [tone, setTone] = useState<Tone>("neutral");
  const [weather, setWeather] = useState<Weather>("clear");
  const [theme, setTheme] = useState<"system" | "dark" | "light">("system");
  const [captionCount, setCaptionCount] = useState(1);
  const [breathe, setBreathe] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", theme);
  }, [theme]);

  // Simulated audio level while listening/speaking.
  const getLevel = useCallback(() => {
    if (state !== "listening" && state !== "speaking") return 0;
    const t = performance.now() / 1000;
    const syllables = Math.max(0, Math.sin(t * 9) * Math.sin(t * 2.3));
    return 0.25 + syllables * 0.6;
  }, [state]);

  return (
    <div className="relative min-h-dvh">
      <Sky weather={weather} />
      <main className="relative mx-auto flex max-w-5xl flex-col gap-8 px-4 py-8">
        <header>
          <p className="text-xs uppercase tracking-widest text-faint">Design system</p>
          <h1 className="font-display text-3xl">Visual lab</h1>
          <p className="mt-1 text-muted">Every state of the core visuals. Colors and motion come from src/styles/tokens.css.</p>
        </header>

        <div className="grid gap-8 md:grid-cols-[1fr_18rem]">
          <section className="flex flex-col items-center gap-6">
            {breathe ? (
              <BreatheMode tone={tone} onClose={() => setBreathe(false)} />
            ) : (
              <>
                <Presence state={state} tone={tone} getLevel={getLevel} className="w-[min(80vw,24rem)]" />
                <Captions lines={SCRIPT.slice(0, captionCount)} />
                <div className="flex gap-2">
                  <Button onClick={() => setCaptionCount((c) => (c % SCRIPT.length) + 1)}>Next caption</Button>
                  <Button variant="ghost" onClick={() => setBreathe(true)}>Breathe mode</Button>
                </div>
              </>
            )}
          </section>

          <aside className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-4 backdrop-blur">
            <Chips label="Presence state" values={STATES} value={state} onChange={setState} />
            <Chips label="Tone" values={TONES} value={tone} onChange={setTone} />
            <Chips label="Weather" values={WEATHERS} value={weather} onChange={setWeather} />
            <Chips label="Theme" values={["system", "dark", "light"] as const} value={theme} onChange={setTheme} />
          </aside>
        </div>

        <section>
          <h2 className="mb-3 font-display text-xl">Weather tiles</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {[...WEATHERS, null].map((w, i) => (
              <div key={w ?? "none"} className="overflow-hidden rounded-md border border-border">
                <Sky weather={w} variant="tile" seed={i + 3} className="h-24" />
                <p className="px-2 py-1 text-xs text-muted">{w ?? "no sessions"}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
