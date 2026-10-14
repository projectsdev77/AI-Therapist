"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/shell/PageShell";
import { Sky } from "@/components/sky/Sky";
import { LinkButton } from "@/components/ui/Button";
import { ChevronIcon } from "@/components/ui/icons";
import { WEATHER_LABELS } from "@/lib/conversation/types";
import { useStore } from "@/lib/data/StoreProvider";
import type { Reflection, Session } from "@/lib/data/types";
import { buildDays, dayKey } from "@/lib/history/days";

const short = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
const longDate = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "short", day: "numeric" });
const time = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });

type Item = { session: Session; reflection: Reflection | null };

export function HistoryView() {
  const { store } = useStore();
  const [data, setData] = useState<{ sessions: Session[]; reflections: Reflection[] } | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([store.listSessions(500), store.listReflections(500)]).then(([sessions, reflections]) => {
      if (!cancelled) setData({ sessions, reflections });
    });
    return () => {
      cancelled = true;
    };
  }, [store]);

  const days = useMemo(() => (data ? buildDays(data.sessions, data.reflections, 30) : []), [data]);
  const groups = useMemo(() => {
    if (!data) return [];
    const byId = new Map(data.reflections.map((r) => [r.sessionId, r]));
    const today = dayKey(new Date());
    const out: { key: string; label: string; items: Item[] }[] = [];
    for (const s of data.sessions) {
      const d = new Date(s.startedAt);
      const key = dayKey(d);
      let g = out.find((x) => x.key === key);
      if (!g) {
        g = { key, label: key === today ? "Today" : longDate.format(d), items: [] };
        out.push(g);
      }
      g.items.push({ session: s, reflection: byId.get(s.id) ?? null });
    }
    return out;
  }, [data]);

  return (
    <PageShell
      title={
        <>
          Your <span className="accent">skies</span>
        </>
      }
      subtitle="The last 30 days, one sky for each day you came by."
    >
      {data && data.sessions.length === 0 ? (
        <div className="flex flex-col items-start gap-4">
          <p className="text-muted">No skies yet. Your first conversation will paint today&apos;s.</p>
          <LinkButton href="/talk?mode=voice" variant="primary">
            Start talking
          </LinkButton>
        </div>
      ) : (
        <div className="flex flex-col gap-[22px]">
          <div>
            <ol aria-label="Last 30 days" className="grid grid-cols-10 gap-[5px]">
              {days.map((d) => {
                const label = `${longDate.format(d.date)}: ${d.weather ? WEATHER_LABELS[d.weather] : "no conversations"}`;
                const cell = d.weather ? (
                  <Sky weather={d.weather} variant="swatch" className="aspect-[3/4] rounded-[7px] border border-border" />
                ) : (
                  <div className="aspect-[3/4] rounded-[7px] border border-border bg-surface opacity-60" />
                );
                return (
                  <li key={d.key} title={label}>
                    {d.sessions.length ? (
                      <a href={`#day-${d.key}`} aria-label={label} className="block rounded-[7px]">
                        {cell}
                      </a>
                    ) : (
                      <span aria-label={label} className="block">
                        {cell}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
            {days.length > 0 && (
              <div className="mt-2 flex justify-between text-[13px] text-faint">
                <span>{short.format(days[0].date)}</span>
                <span>Today</span>
              </div>
            )}
          </div>

          {groups.map((g) => (
            <section key={g.key} id={`day-${g.key}`} className="flex scroll-mt-24 flex-col gap-2">
              <h2 className="text-sm font-medium text-muted">{g.label}</h2>
              {g.items.map(({ session, reflection }) => {
                const weather = reflection?.weather ?? session.weather;
                return (
                  <Link
                    key={session.id}
                    href={`/history/${session.id}`}
                    className="flex min-h-16 items-center gap-3.5 rounded-md border border-border bg-surface py-2 pr-3.5 pl-2 shadow-soft transition-colors duration-[var(--motion-base)] hover:bg-surface-strong"
                  >
                    <Sky weather={weather} variant="tile" seed={session.id.charCodeAt(1)} className="size-12 shrink-0 overflow-hidden rounded-[12px]" />
                    <span className="flex flex-1 flex-col">
                      <span>{reflection?.title ?? session.title ?? "A short conversation"}</span>
                      <span className="text-sm text-muted">
                        {time.format(new Date(session.startedAt))}
                        {weather ? ` · ${WEATHER_LABELS[weather]}` : ""}
                      </span>
                    </span>
                    <ChevronIcon size={18} className="text-faint" />
                  </Link>
                );
              })}
            </section>
          ))}
        </div>
      )}
    </PageShell>
  );
}
