import { Sky } from "@/components/sky/Sky";
import { WEATHER_LABELS } from "@/lib/conversation/types";
import type { Reflection } from "@/lib/data/types";

const dateFmt = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" });

/** A session folded into a typeset card. */
export function ReflectionCard({ reflection, id }: { reflection: Reflection; id?: string }) {
  return (
    <article id={id} className="overflow-hidden rounded-lg border border-border bg-bg shadow-xl">
      <div className="relative h-36">
        <Sky weather={reflection.weather} variant="tile" seed={reflection.id.charCodeAt(0)} className="h-full" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-bg/80 to-transparent px-5 pb-3 pt-8">
          <p className="text-xs uppercase tracking-widest text-muted">{dateFmt.format(new Date(reflection.createdAt))}</p>
          <p className="text-xs text-muted">{WEATHER_LABELS[reflection.weather]}</p>
        </div>
      </div>
      <div className="flex flex-col gap-5 p-5 sm:p-7">
        <h2 className="font-display text-2xl leading-tight sm:text-3xl">{reflection.title}</h2>

        {reflection.quotes.length > 0 && (
          <section aria-label="In your words" className="flex flex-col gap-3">
            {reflection.quotes.map((q) => (
              <blockquote key={q} className="border-l-2 border-accent pl-4 font-display text-lg italic leading-snug text-muted">
                “{q}”
              </blockquote>
            ))}
          </section>
        )}

        <p className="text-[1.05rem] leading-relaxed">{reflection.insight}</p>

        {reflection.nextStep && (
          <div className="rounded-md bg-surface p-4">
            <p className="text-xs uppercase tracking-widest text-faint">A small next step</p>
            <p className="mt-1">{reflection.nextStep}</p>
          </div>
        )}

        {reflection.themes.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Themes">
            {reflection.themes.map((t) => (
              <li key={t} className="rounded-pill border border-border px-3 py-1 text-sm text-muted">
                {t}
              </li>
            ))}
          </ul>
        )}
      </div>
    </article>
  );
}
