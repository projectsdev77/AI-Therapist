"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { PageShell } from "@/components/shell/PageShell";
import { Sky } from "@/components/sky/Sky";
import { LinkButton } from "@/components/ui/Button";
import { WEATHER_LABELS } from "@/lib/conversation/types";
import { useStore } from "@/lib/data/StoreProvider";
import type { Reflection, Session } from "@/lib/data/types";
import { buildDays } from "@/lib/history/days";

const weekday = new Intl.DateTimeFormat(undefined, { weekday: "short" });
const longDate = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" });
const time = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });

export function HistoryView() {
  const { store } = useStore();
  const [data, setData] = useState<{ sessions: Session[]; reflections: Reflection[] } | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);

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
  const withSessions = [...days].reverse().filter((d) => d.sessions.length > 0);
  const olderSessions = useMemo(() => {
    if (!data) return [];
    const cutoff = days[0]?.date.getTime() ?? 0;
    const byId = new Map(data.reflections.map((r) => [r.sessionId, r]));
    return data.sessions.filter((s) => new Date(s.startedAt).getTime() < cutoff).map((s) => ({ session: s, reflection: byId.get(s.id) ?? null }));
  }, [data, days]);

  useEffect(() => {
    // Start scrolled to today (the right end).
    const el = stripRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [days.length]);

  return (
    <PageShell title="Your skies" subtitle="Each day's sky comes from how your conversations felt." >
      {data && data.sessions.length === 0 ? (
        <div className="flex flex-col items-start gap-4">
          <p className="text-muted">No conversations yet. Your first one will paint today&apos;s sky.</p>
          <LinkButton href="/talk?mode=voice" variant="primary">
            Start talking
          </LinkButton>
        </div>
      ) : (
        <>
          <div
            ref={stripRef}
            className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:thin]"
            role="list"
            aria-label="Last 30 days"
          >
            {days.map((d, i) => {
              const label = `${longDate.format(d.date)}: ${d.weather ? WEATHER_LABELS[d.weather] : "no conversations"}`;
              const tile = (
                <>
                  <div className={`relative h-32 w-14 overflow-hidden rounded-md border ${d.weather ? "border-border" : "border-dashed border-border opacity-40"}`}>
                    {d.weather && <Sky weather={d.weather} variant="tile" seed={i + 11} className="h-full" />}
                  </div>
                  <span className="mt-1 block text-center text-[0.7rem] text-faint">{weekday.format(d.date)}</span>
                  <span className="block text-center text-xs text-muted">{d.date.getDate()}</span>
                </>
              );
              return (
                <div key={d.key} role="listitem" className="shrink-0 snap-end">
                  {d.sessions.length ? (
                    <a href={`#day-${d.key}`} aria-label={label} className="block rounded-md">
                      {tile}
                    </a>
                  ) : (
                    <div aria-label={label}>{tile}</div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-10 flex flex-col gap-10">
            {withSessions.map((d) => (
              <section key={d.key} id={`day-${d.key}`} className="scroll-mt-24">
                <h2 className="mb-3 font-display text-xl">{longDate.format(d.date)}</h2>
                <SessionList items={d.sessions} />
              </section>
            ))}
            {olderSessions.length > 0 && (
              <section>
                <h2 className="mb-3 font-display text-xl">Earlier</h2>
                <SessionList items={olderSessions} showDate />
              </section>
            )}
          </div>
        </>
      )}
    </PageShell>
  );
}

function SessionList({ items, showDate = false }: { items: { session: Session; reflection: Reflection | null }[]; showDate?: boolean }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map(({ session, reflection }) => (
        <li key={session.id}>
          <Link
            href={`/history/${session.id}`}
            className="flex h-full overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:bg-surface-strong"
          >
            <div className="relative w-16 shrink-0">
              <Sky weather={reflection?.weather ?? session.weather} variant="tile" seed={session.id.charCodeAt(1)} className="h-full" />
            </div>
            <div className="p-4">
              <p className="text-xs text-faint">
                {showDate ? `${longDate.format(new Date(session.startedAt))} · ` : ""}
                {time.format(new Date(session.startedAt))} · {session.mode === "voice" ? "Talked" : "Wrote"}
              </p>
              <p className="mt-1 font-display text-lg leading-snug">{reflection?.title ?? session.title ?? "A short conversation"}</p>
              {reflection && <p className="mt-1 line-clamp-2 text-sm text-muted">{reflection.insight}</p>}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
