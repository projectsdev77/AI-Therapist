import { Sky } from "@/components/sky/Sky";
import { WEATHER_LABELS } from "@/lib/conversation/types";
import type { Reflection } from "@/lib/data/types";

const dateFmt = new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric", month: "short" });
const timeFmt = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });

/** A conversation folded into a card. */
export function ReflectionCard({ reflection, id }: { reflection: Reflection; id?: string }) {
  const d = new Date(reflection.createdAt);
  return (
    <article id={id} className="overflow-hidden rounded-lg border border-border bg-surface shadow-soft">
      <div className="relative h-[150px] overflow-hidden">
        <Sky weather={reflection.weather} variant="tile" seed={reflection.id.charCodeAt(0)} className="absolute! inset-0" />
        <div className="absolute inset-x-5 bottom-3.5 flex items-end justify-between text-sm">
          <span className="font-medium">
            {dateFmt.format(d)} · {timeFmt.format(d)}
          </span>
          <span className="text-muted">{WEATHER_LABELS[reflection.weather]}</span>
        </div>
      </div>
      <div className="flex flex-col gap-[18px] px-[22px] pt-5 pb-6">
        <h1 className="text-[30px] leading-[1.15] font-light tracking-[-0.02em] text-balance">{reflection.title}</h1>

        {reflection.quotes.length > 0 && (
          <section aria-label="In your words" className="flex flex-col gap-2.5">
            {reflection.quotes.map((q) => (
              <p key={q} className="voice-person text-[21px] leading-[1.35]">
                &ldquo;{q}&rdquo;
              </p>
            ))}
          </section>
        )}

        <p className="text-muted text-pretty">{reflection.insight}</p>

        {reflection.nextStep && (
          <div className="flex flex-col gap-0.5 rounded-md bg-band px-4 py-3.5">
            <span className="text-[13px] font-medium tracking-[0.02em] text-accent-strong">A small next step</span>
            <span>{reflection.nextStep}</span>
          </div>
        )}

        {reflection.themes.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Themes">
            {reflection.themes.map((t) => (
              <li key={t} className="rounded-pill border border-border px-3 py-1.5 text-sm text-muted capitalize">
                {t}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
