"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppShell, useShell } from "@/components/shell/AppShell";
import { BackIcon, ChevronIcon } from "@/components/ui/icons";
import { WEATHERS, WEATHER_LABELS, type Weather } from "@/lib/conversation/types";
import { useStartConversation } from "@/lib/conversation/startConversation";
import type { Reflection, Session } from "@/lib/data/types";
import { skyGradient } from "@/lib/design/skies";
import { dayKey, heaviest } from "@/lib/history/days";
import { useStartIn } from "@/lib/startIn";
import { ConsentSheet } from "@/components/consent/ConsentSheet";

type Item = { session: Session; reflection: Reflection | null };

const monthFmt = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" });
const dayFmt = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" });
const longDay = new Intl.DateTimeFormat(undefined, { month: "long", day: "numeric" });
const time = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const LIGHT: Weather[] = ["clear", "haze", "breaking"];

const weatherOf = (i: Item) => i.reflection?.weather ?? i.session.weather;

/** "Your skies" on desktop (desktop handoff "skies"): a month calendar; the chosen day's conversations in the panel. */
export function DesktopSkies({ items }: { items: Item[] }) {
  const today = new Date();
  const todayKey = dayKey(today);
  const byDay = useMemo(() => {
    const m = new Map<string, Item[]>();
    for (const i of items) {
      const k = dayKey(new Date(i.session.startedAt));
      m.set(k, [...(m.get(k) ?? []), i]);
    }
    return m;
  }, [items]);

  const latest = items[0] ? new Date(items[0].session.startedAt) : today;
  const [month, setMonth] = useState(() => new Date(latest.getFullYear(), latest.getMonth(), 1));
  const [selected, setSelected] = useState<string | null>(items[0] ? dayKey(latest) : null);
  const empty = items.length === 0;

  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const lead = (first.getDay() + 6) % 7; // Monday first
    const daysIn = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const out: (Date | null)[] = Array.from({ length: lead }, () => null);
    for (let d = 1; d <= daysIn; d++) out.push(new Date(month.getFullYear(), month.getMonth(), d));
    while (out.length % 7) out.push(null);
    return out;
  }, [month]);

  const atThisMonth = month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth();
  const dayItems = selected ? (byDay.get(selected) ?? []) : [];
  const selDate = selected ? new Date(`${selected}T12:00:00`) : null;
  const selWeather = heaviest(dayItems.map(weatherOf).filter((w): w is Weather => w !== null));
  const used = new Set(items.map(weatherOf));

  return (
    <AppShell
      panel={!empty && selected ? <DayPanel date={selDate!} weather={selWeather} items={dayItems} /> : undefined}
      panelLabel="Details"
    >
      <div className="px-10 py-8">
        <div className="mx-auto flex max-w-[880px] flex-col gap-[22px]">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex flex-1 flex-col gap-1">
              <h1 className="m-0 text-[40px] leading-[1.1] font-semibold tracking-[-0.04em]">Your skies</h1>
              <p className="m-0 text-muted">How each day&apos;s conversations sounded. Not a measure of you.</p>
            </div>
            <div role="group" aria-label="Month" className="flex items-center gap-1 rounded-pill border border-edge-hi bg-glass p-1">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                className="press flex size-9 items-center justify-center rounded-full text-text hover:bg-glass-strong"
              >
                <BackIcon size={18} />
              </button>
              <span aria-live="polite" className="min-w-[140px] text-center text-[15px] font-semibold">
                {monthFmt.format(month)}
              </span>
              <button
                type="button"
                aria-label="Next month"
                disabled={atThisMonth}
                onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                className="press flex size-9 items-center justify-center rounded-full text-text hover:bg-glass-strong disabled:text-faint disabled:hover:bg-transparent"
              >
                <ChevronIcon size={18} />
              </button>
            </div>
          </div>

          {empty && <FirstSky />}

          <div className="flex flex-col gap-2.5 rounded-lg border border-edge-hi p-[18px]" style={{ background: "rgba(8,30,40,.45)" }}>
            <div aria-hidden className="grid grid-cols-7 gap-2 text-center text-[12px] font-semibold text-faint">
              {WEEKDAYS.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {cells.map((d, i) => {
                if (!d) return <span key={`b${i}`} />;
                const k = dayKey(d);
                const list = byDay.get(k) ?? [];
                const w = heaviest(list.map(weatherOf).filter((x): x is Weather => x !== null));
                const future = d > today && k !== todayKey;
                const has = list.length > 0;
                const sel = k === selected;
                const isToday = k === todayKey;
                const fg = has ? (w && LIGHT.includes(w) ? "#06302c" : "#effcfa") : "var(--lg-text-faint)";
                return (
                  <button
                    key={k}
                    type="button"
                    disabled={!has}
                    aria-pressed={has ? sel : undefined}
                    aria-label={`${longDay.format(d)}, ${has ? `${list.length} conversation${list.length === 1 ? "" : "s"}${w ? `, ${WEATHER_LABELS[w]}` : ""}` : "no conversations"}`}
                    onClick={() => setSelected(k)}
                    className="press flex aspect-[1.3] flex-col items-start justify-between rounded-[14px] px-2.5 py-2 text-left text-[13px] font-semibold enabled:hover:brightness-110"
                    style={{
                      background: has ? skyGradient(w ?? "quiet") : "rgba(255,255,255,.03)",
                      color: fg,
                      opacity: future ? 0.35 : 1,
                      border: sel ? "2px solid #effcfa" : has ? "0" : isToday ? "1.5px solid rgba(143,240,232,.6)" : "1px dashed var(--lg-edge-lo)",
                      boxShadow: sel ? "0 0 0 4px rgba(239,252,250,.15)" : "none",
                    }}
                  >
                    <span>{d.getDate()}</span>
                    <span className="text-[11px] font-medium opacity-85">{has ? `${list.length} talk${list.length === 1 ? "" : "s"}` : isToday ? "Today" : ""}</span>
                  </button>
                );
              })}
            </div>
            <ul className="m-0 mt-1.5 flex list-none flex-wrap gap-x-[18px] gap-y-1.5 p-0">
              {WEATHERS.filter((w) => w !== "quiet" || used.has("quiet")).map((w) => (
                <li key={w} className="flex items-center gap-[7px] text-[13px] text-muted">
                  <span aria-hidden className="size-3 rounded-[4px]" style={{ background: skyGradient(w) }} />
                  {WEATHER_LABELS[w]}
                </li>
              ))}
              <li className="flex items-center gap-[7px] text-[13px] text-muted">
                <span aria-hidden className="size-3 rounded-[4px] bg-[rgba(255,255,255,.08)]" />
                No talk
              </li>
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function FirstSky() {
  const startIn = useStartIn();
  const { start, consentProps } = useStartConversation();
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-md border border-edge-hi bg-glass-strong px-5 py-[18px]">
      <span className="flex min-w-[260px] flex-1 flex-col">
        <strong className="text-[18px] font-semibold">Your first sky is waiting</strong>
        <span className="text-[15px] text-muted">Your skies will appear here as we talk.</span>
      </span>
      <button type="button" onClick={() => start(startIn)} className="press min-h-12 rounded-pill bg-mic px-5 text-[15px] font-semibold text-mic-fg hover:bg-mic-hover">
        Start a conversation
      </button>
      <ConsentSheet {...consentProps} />
    </div>
  );
}

function DayPanel({ date, weather, items }: { date: Date; weather: Weather | null; items: Item[] }) {
  const shell = useShell();
  return (
    <>
      <section className="flex flex-col gap-3">
        <div className="relative h-[120px] overflow-hidden rounded-md" style={{ background: skyGradient(weather ?? "quiet") }}>
          <span aria-hidden className="absolute inset-0" style={{ background: "linear-gradient(180deg,rgba(255,255,255,.2),transparent 50%,rgba(8,24,34,.55))" }} />
          <span className="absolute bottom-2.5 left-3.5 text-[14px] font-semibold">
            {dayFmt.format(date)}
            {weather ? ` · ${WEATHER_LABELS[weather]}` : ""}
          </span>
        </div>
        <h2 className="m-0 text-[22px] font-semibold tracking-[-0.03em]">
          {items.length} conversation{items.length === 1 ? "" : "s"}
        </h2>
      </section>
      {items.map(({ session, reflection }) => {
        const open = !reflection && !session.endedAt;
        const w = reflection?.weather ?? session.weather;
        return (
          <Link
            key={session.id}
            href={open ? `/talk?resume=${session.id}` : `/history/${session.id}`}
            className="press flex flex-col gap-1.5 rounded-md border border-edge-hi bg-glass p-3.5 text-text no-underline hover:bg-glass-strong hover:text-text"
          >
            <span className="flex justify-between text-[12px] text-muted">
              <span>{time.format(new Date(session.startedAt))}</span>
              <span>{open ? "Not wrapped up yet" : w ? WEATHER_LABELS[w] : ""}</span>
            </span>
            <span className="text-base font-semibold tracking-[-0.01em]">{reflection?.title ?? session.title ?? "A conversation"}</span>
            {reflection?.quotes[0] && <span className="border-l-2 border-[rgba(143,240,232,.4)] pl-2.5 text-[14px] text-muted">“{reflection.quotes[0]}”</span>}
          </Link>
        );
      })}
      <p className="m-0 text-[13px] text-muted">
        Hard days are part of it. If storms keep coming,{" "}
        <button type="button" onClick={() => shell?.openHelp()} className="bg-transparent p-0 text-[13px] text-care underline underline-offset-2">
          talking to a person can help
        </button>
        .
      </p>
    </>
  );
}
