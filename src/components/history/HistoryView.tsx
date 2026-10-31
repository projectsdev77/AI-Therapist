"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { PageShell } from "@/components/shell/PageShell";
import { LinkButton } from "@/components/ui/Button";
import { ChevronIcon } from "@/components/ui/icons";
import { WEATHERS, WEATHER_LABELS, type Weather } from "@/lib/conversation/types";
import { useStore } from "@/lib/data/StoreProvider";
import type { Reflection, Session } from "@/lib/data/types";
import { SKY_COLORS, skyGradient, skyLine } from "@/lib/design/skies";
import { buildDays, dayKey } from "@/lib/history/days";
import { HOME } from "@/lib/routes";
import { useIsWide } from "@/lib/useIsDesktop";
import { DesktopSkies } from "./DesktopSkies";

const short = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });
const rowDay = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" });
const time = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });

type Item = { session: Session; reflection: Reflection | null };

/** "Your skies": the 30-day sky line, a count for each sky, and recent conversations. */
export function HistoryView() {
  const { store } = useStore();
  const [data, setData] = useState<{ sessions: Session[]; reflections: Reflection[]; withWords: Set<string> } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [sessions, reflections] = await Promise.all([store.listSessions(200), store.listReflections(500)]);
      // Conversations without a card only count once the person has said something.
      const carded = new Set(reflections.map((r) => r.sessionId));
      const withWords = new Set<string>();
      for (const s of sessions.filter((x) => !carded.has(x.id)).slice(0, 20)) {
        if ((await store.listMessages(s.id)).some((m) => m.role === "user")) withWords.add(s.id);
      }
      if (!cancelled) setData({ sessions, reflections, withWords });
    })();
    return () => {
      cancelled = true;
    };
  }, [store]);

  const days = useMemo(() => (data ? buildDays(data.sessions, data.reflections, 30) : []), [data]);
  const items = useMemo<Item[]>(() => {
    if (!data) return [];
    const byId = new Map(data.reflections.map((r) => [r.sessionId, r]));
    return data.sessions
      .map((s) => ({ session: s, reflection: byId.get(s.id) ?? null }))
      .filter((i) => i.reflection || data.withWords.has(i.session.id));
  }, [data]);

  const counts = useMemo(() => {
    const c = new Map<Weather, number>();
    for (const d of days) for (const { session, reflection } of d.sessions) {
      const w = reflection?.weather ?? session.weather;
      if (w) c.set(w, (c.get(w) ?? 0) + 1);
    }
    return c;
  }, [days]);

  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  const most = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  const summary = total
    ? `30 days of skies: ${total} conversation${total === 1 ? "" : "s"}, most often ${WEATHER_LABELS[most!].toLowerCase()}.`
    : "30 days of skies, no conversations yet.";
  // Only read the clock once data has loaded (never during prerender).
  const today = data ? dayKey(new Date()) : "";
  const wide = useIsWide();
  if (wide && data) return <DesktopSkies items={items} />;

  return (
    <PageShell title="Your skies" subtitle="How the last 30 days of conversations sounded." width={720}>
      {data && items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-edge-hi bg-glass px-5 py-10 text-center">
          <span
            aria-hidden
            className="h-14 w-full max-w-[360px] rounded-sm"
            style={{ background: "repeating-linear-gradient(90deg, rgba(255,255,255,.06) 0 10px, transparent 10px 12px)" }}
          />
          <h2 className="m-0 mt-2 text-[20px] font-semibold">Your first sky is waiting</h2>
          <p className="m-0 max-w-[360px] text-[15px] text-muted">Your skies will appear here as we talk.</p>
          <LinkButton href={HOME} variant="primary" size="lg" className="mt-1.5 px-[22px]">
            Start a conversation
          </LinkButton>
        </div>
      ) : data ? (
        <>
          <div className="flex flex-col gap-3 rounded-lg border border-edge-hi bg-glass p-[18px]">
            <div role="img" aria-label={summary} className="relative h-[76px] overflow-hidden rounded-sm" style={{ background: skyLine(days.map((d) => d.weather)) }}>
              <div aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(255,255,255,.18), transparent 50%, rgba(8,24,34,.25))" }} />
            </div>
            <div aria-hidden className="flex justify-between text-[13px] text-faint">
              <span>{days[0] && short.format(days[0].date)}</span>
              <span>{days[15] && short.format(days[15].date)}</span>
              <span>Today</span>
            </div>
            <ul className="m-0 mt-0.5 flex list-none flex-wrap gap-x-4 gap-y-1.5 p-0">
              {WEATHERS.filter((w) => w !== "quiet" || counts.get("quiet")).map((w) => (
                <li key={w} className="flex items-center gap-[7px] text-[14px] text-muted">
                  <span aria-hidden className="size-3 rounded-full" style={{ background: skyGradient(w) }} />
                  {WEATHER_LABELS[w]}
                  <span className="font-semibold text-text">{counts.get(w) ?? 0}</span>
                </li>
              ))}
            </ul>
            <p className="m-0 mt-1 text-[14px] text-muted">Each sky is how a conversation sounded to me, not a measure of you. You can change any of them.</p>
          </div>

          <section className="flex flex-col gap-0.5">
            <h2 className="t-group m-0 mb-1.5 ml-1">Recent conversations</h2>
            {items.slice(0, 40).map(({ session, reflection }) => {
              const w = reflection?.weather ?? session.weather;
              const d = new Date(session.startedAt);
              const open = !reflection && !session.endedAt;
              const meta = !reflection
                ? `${time.format(d)} · ${open ? "Not wrapped up yet" : "Card not made yet"}`
                  : `${time.format(d)} · ${WEATHER_LABELS[reflection.weather]}${reflection.weatherByPerson ? " · chosen by you" : ""}`;
              return (
                <Link
                  key={session.id}
                  href={open ? `/talk?resume=${session.id}` : `/history/${session.id}`}
                  className="press flex min-h-16 items-center gap-3.5 rounded-sm px-3 py-2 text-text no-underline hover:bg-glass hover:text-text"
                >
                  <span className="w-16 shrink-0 text-[13px] leading-[1.3] text-muted">{dayKey(d) === today ? "Today" : rowDay.format(d)}</span>
                  <span
                    aria-hidden
                    className="size-7 shrink-0 rounded-full"
                    style={{ background: skyGradient(w ?? "quiet"), boxShadow: `0 0 12px ${SKY_COLORS[w ?? "quiet"][1]}66` }}
                  />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="text-base">{reflection?.title ?? session.title ?? "A conversation"}</span>
                    <span className="text-[14px] text-muted">{meta}</span>
                  </span>
                  <ChevronIcon size={18} className="text-faint" />
                </Link>
              );
            })}
          </section>
        </>
      ) : null}
    </PageShell>
  );
}
