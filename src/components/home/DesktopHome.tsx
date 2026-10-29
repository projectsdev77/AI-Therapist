"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Presence } from "@/components/presence/Presence";
import { AppShell } from "@/components/shell/AppShell";
import { BreatheIcon, MemoryIcon, MicIcon, SkiesIcon } from "@/components/ui/icons";
import { BRAND } from "@/lib/brand";
import { STARTERS } from "@/lib/conversation/starters";
import { WEATHER_LABELS } from "@/lib/conversation/types";
import { useStartConversation } from "@/lib/conversation/startConversation";
import { useStore } from "@/lib/data/StoreProvider";
import type { Memory, Reflection, Session } from "@/lib/data/types";
import { SKY_COLORS, skyGradient } from "@/lib/design/skies";
import { timeOfDayGreeting } from "@/lib/greeting";
import { buildDays, type DayEntry } from "@/lib/history/days";
import { resourcesFor } from "@/lib/safety/resources";
import { useRegion } from "@/lib/safety/useRegion";
import { useShortcuts } from "@/lib/shortcuts";
import { ConsentSheet } from "@/components/consent/ConsentSheet";

const weekday = new Intl.DateTimeFormat(undefined, { weekday: "long" });
const longDate = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "short", day: "numeric" });

const EXPECT = [
  { t: "Talk or write, your way", d: "I listen first and reply calmly. No rush.", Icon: MicIcon },
  { t: "Leave with a card and a sky", d: "Each conversation becomes a short reflection you can edit or delete.", Icon: SkiesIcon },
  { t: "I remember, you decide", d: "I keep short notes so you don't start over. See or delete any of them.", Icon: MemoryIcon },
];

const label = "m-0 text-[12px] font-semibold tracking-[.06em] text-faint uppercase";

type Data = { latest: { session: Session; reflection: Reflection | null } | null; days: DayEntry[]; notes: Memory[] };

/** Home in the desktop shell (desktop handoff "home-first" / "home-return"). */
export function DesktopHome() {
  const router = useRouter();
  const { store, profile } = useStore();
  const { start, consentProps } = useStartConversation();
  const region = useRegion();
  const res = resourcesFor(region);
  const [data, setData] = useState<Data | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [sessions, reflections, notes] = await Promise.all([store.listSessions(60), store.listReflections(60), store.listMemories()]);
      if (cancelled) return;
      const latestSession = sessions[0];
      setData({
        latest: latestSession ? { session: latestSession, reflection: reflections.find((r) => r.sessionId === latestSession.id) ?? null } : null,
        days: buildDays(sessions, reflections, 14),
        notes,
      });
    })().catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [store]);

  useShortcuts({ Space: () => start("voice"), b: () => router.push("/breathe"), B: () => router.push("/breathe") });

  const returning = data?.latest != null;
  const name = profile?.displayName;
  const latest = data?.latest;
  const lastWeather = latest?.reflection?.weather ?? latest?.session.weather ?? null;
  const open = latest ? !latest.reflection && !latest.session.endedAt : false;
  const memoryOn = profile?.memoryEnabled ?? true;

  function submit(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (text) start("text", { text });
    else start("text");
  }

  const panel = !data ? null : returning && latest ? (
    <>
      <section className="flex flex-col gap-2.5">
        <h2 className={label}>{open ? "Pick up where you left off" : "Last time"}</h2>
        <Link
          href={open ? `/talk?resume=${latest.session.id}` : `/history/${latest.session.id}`}
          className="press flex flex-col overflow-hidden rounded-md border border-edge-hi bg-glass text-text no-underline hover:bg-glass-strong hover:text-text"
        >
          <span aria-hidden className="h-16" style={{ background: skyGradient(lastWeather ?? "quiet") }} />
          <span className="flex flex-col gap-0.5 px-3.5 pt-3 pb-3.5">
            <span className="text-[12px] text-muted">
              {weekday.format(new Date(latest.session.startedAt))}
              {lastWeather ? ` · ${WEATHER_LABELS[lastWeather]}` : open ? " · Not wrapped up yet" : ""}
            </span>
            <span className="text-base font-semibold tracking-[-0.01em]">{latest.reflection?.title ?? latest.session.title ?? "Our last conversation"}</span>
            {latest.reflection?.nextStep && <span className="mt-1.5 text-[13px] text-muted">Next step: {latest.reflection.nextStep}</span>}
            {open && <span className="mt-1.5 text-[13px] font-semibold text-accent-strong">Pick up</span>}
          </span>
        </Link>
      </section>
      <section className="flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between">
          <h2 className={label}>Last 14 days</h2>
          <Link href="/history" className="text-[13px] no-underline">
            All skies
          </Link>
        </div>
        <div
          role="img"
          aria-label={`Last 14 days of skies: ${data.days.filter((d) => d.weather).length} days with a conversation`}
          className="grid grid-cols-[repeat(14,minmax(0,1fr))] gap-[3px]"
        >
          {data.days.map((d) => (
            <span key={d.key} className="h-9 rounded-[5px]" style={{ background: d.weather ? SKY_COLORS[d.weather][1] : "rgba(255,255,255,.06)" }} />
          ))}
        </div>
      </section>
      {memoryOn && data.notes.length > 0 && (
        <section className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <h2 className={label}>What I remember</h2>
            <Link href="/memory" className="text-[13px] no-underline">
              See all
            </Link>
          </div>
          {data.notes.slice(0, 3).map((n) => (
            <p key={n.id} className="m-0 rounded-[12px] bg-glass px-3 py-2.5 text-[14px]">
              {n.fact}
            </p>
          ))}
        </section>
      )}
    </>
  ) : (
    <>
      <h2 className={label}>What to expect</h2>
      {EXPECT.map(({ t, d, Icon }) => (
        <div key={t} className="flex gap-3">
          <span aria-hidden className="flex size-9 shrink-0 items-center justify-center rounded-full bg-glass-strong text-accent-strong">
            <Icon size={18} />
          </span>
          <span className="flex flex-col">
            <strong className="text-[15px] font-semibold">{t}</strong>
            <span className="text-[14px] text-muted">{d}</span>
          </span>
        </div>
      ))}
      <p className="m-0 mt-auto rounded-[12px] bg-care-surface px-3.5 py-3 text-[13px]">
        Not for emergencies. If you might be in danger, call <strong className="text-care">{res.emergency}</strong>
        {res.lines[0]?.call ? (
          <>
            {" "}
            or {res.lines[0].text ? "call or text" : "call"} <strong className="text-care">{res.lines[0].callDisplay ?? res.lines[0].call}</strong>
          </>
        ) : null}
        .
      </p>
    </>
  );

  return (
    <AppShell panel={panel} panelLabel={returning ? "Your recent days" : "What to expect"} scroll={false}>
      <div className={`relative flex min-h-0 flex-1 flex-col items-center justify-center px-12 py-8 text-center ${data ? "" : "invisible"}`}>
        <Presence state="idle" size={200} />
        <p className="m-0 mt-[18px] text-[15px] text-muted">
          {returning ? `${timeOfDayGreeting()}${name ? `, ${name}` : ""} · ${longDate.format(new Date())}` : `Welcome to ${BRAND.name}`}
        </p>
        <h1 className="m-0 mt-1 max-w-[640px] text-[46px] leading-[1.06] font-semibold tracking-[-0.04em] text-balance">
          {returning ? "How are you, really?" : "Somewhere quiet to think out loud"}
        </h1>
        {!returning && (
          <p className="m-0 mt-2.5 max-w-[520px] text-[17px] text-muted">Untangle a thought, get through a hard moment, or check in with yourself.</p>
        )}
        <div className="mt-7 flex w-full max-w-[680px] flex-col gap-3">
          <form
            onSubmit={submit}
            className="flex min-h-16 items-center gap-2.5 rounded-[32px] border border-edge-hi py-2 pr-2 pl-[22px] shadow-[0_18px_50px_rgba(0,0,0,.25)] backdrop-blur-[18px] focus-within:border-[rgba(143,240,232,.45)]"
            style={{ background: "rgba(8,30,40,.55)" }}
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              aria-label="Write what's on your mind"
              placeholder="Write what's on your mind, or press Space to talk"
              maxLength={4000}
              className="min-w-0 flex-1 border-0 bg-transparent text-[17px] text-text outline-none placeholder:text-faint"
            />
            {draft.trim() ? (
              <button type="submit" className="press flex h-12 shrink-0 items-center gap-2 rounded-[24px] bg-mic pr-5 pl-4 text-[15px] font-semibold text-mic-fg hover:bg-mic-hover">
                Start writing
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => router.push("/breathe")}
                  aria-label="Help me slow down"
                  title="Breathe (B)"
                  className="press flex size-12 shrink-0 items-center justify-center rounded-full border border-edge-lo bg-glass text-text hover:bg-glass-strong"
                >
                  <BreatheIcon size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => start("voice")}
                  title="Talk (Space)"
                  className="press flex h-12 shrink-0 items-center gap-2 rounded-[24px] bg-mic pr-5 pl-4 text-[15px] font-semibold text-mic-fg shadow-[0_6px_18px_var(--lg-mic-shadow)] hover:bg-mic-hover"
                >
                  <MicIcon size={18} />
                  Talk
                </button>
              </>
            )}
          </form>
          <div role="group" aria-label="Or start with" className="flex flex-wrap justify-center gap-1.5">
            {STARTERS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => start("text", { starterId: s.id })}
                className="press min-h-10 rounded-pill border border-edge-lo px-3.5 text-[14px] text-muted hover:bg-glass hover:text-text"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <p className="relative m-0 px-12 pb-[18px] text-center text-[13px] text-faint">
        {BRAND.name} is an AI companion, not a clinician or an emergency service. If you&apos;re in danger, call {res.emergency}.
      </p>
      <ConsentSheet {...consentProps} />
    </AppShell>
  );
}
