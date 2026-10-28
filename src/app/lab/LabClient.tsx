"use client";

import { Presence } from "@/components/presence/Presence";
import { Backdrop } from "@/components/shell/Backdrop";
import { WEATHERS, WEATHER_LABELS, type PresenceState } from "@/lib/conversation/types";
import { skyGradient } from "@/lib/design/skies";

const STATES: { id: PresenceState; desc: string }[] = [
  { id: "idle", desc: "Floats; now and then looks to one side." },
  { id: "listening", desc: "Faces you and leans in. Rings 1.25×." },
  { id: "thinking", desc: "Looks up and away, drifting. Rings 0.6×." },
  { id: "speaking", desc: "Pulses and sways. Rings 1.8×." },
  { id: "breathing", desc: "4s in, 6s out. Eyes follow the breath." },
  { id: "concerned", desc: "Still, softer, eyes lowered. Rings 0.45×." },
];

/** Internal page: every orb state and sky, for design review. */
export function LabClient() {
  return (
    <div className="relative min-h-dvh">
      <Backdrop />
      <main className="relative mx-auto flex max-w-[1040px] flex-col gap-10 px-5 py-10">
        <h1 className="t-page-h1">Visual lab</h1>
        <section className="flex flex-col gap-4">
          <h2 className="t-group">Orb states</h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
            {STATES.map((s) => (
              <div key={s.id} className="glass flex flex-col items-center gap-3 rounded-lg p-5 text-center">
                <Presence state={s.id} size={170} />
                <strong className="font-semibold capitalize">{s.id}</strong>
                <span className="text-sm text-muted">{s.desc}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="flex flex-col gap-4">
          <h2 className="t-group">Skies</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {WEATHERS.map((w) => (
              <div key={w} className="flex flex-col gap-2 text-sm">
                <span className="h-16 rounded-[12px]" style={{ background: skyGradient(w) }} />
                {WEATHER_LABELS[w]}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
