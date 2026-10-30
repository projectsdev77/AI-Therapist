"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Presence } from "@/components/presence/Presence";
import { AppShell } from "@/components/shell/AppShell";
import { BreatheIcon, MicIcon } from "@/components/ui/icons";
import { BRAND } from "@/lib/brand";
import { STARTERS } from "@/lib/conversation/starters";
import { useStartConversation } from "@/lib/conversation/startConversation";
import { useStore } from "@/lib/data/StoreProvider";
import type { Reflection, Session } from "@/lib/data/types";
import { skyGradient } from "@/lib/design/skies";
import { timeOfDayGreeting } from "@/lib/greeting";
import { resourcesFor } from "@/lib/safety/resources";
import { useRegion } from "@/lib/safety/useRegion";
import { useShortcuts } from "@/lib/shortcuts";
import { ConsentSheet } from "@/components/consent/ConsentSheet";

const longDate = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "short", day: "numeric" });

type Data = { latest: { session: Session; reflection: Reflection | null } | null };

/** Home in the desktop shell (desktop handoff "home-first" / "home-return", calmer pass: no side panel). */
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
      const [sessions, reflections] = await Promise.all([store.listSessions(1), store.listReflections(5)]);
      if (cancelled) return;
      const latestSession = sessions[0];
      setData({
        latest: latestSession ? { session: latestSession, reflection: reflections.find((r) => r.sessionId === latestSession.id) ?? null } : null,
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

  function submit(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (text) start("text", { text });
    else start("text");
  }

  return (
    <AppShell scroll={false}>
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
            {STARTERS.filter((s) => s.id !== "stuck").map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => start("text", { starterId: s.id })}
                className="press min-h-10 rounded-pill px-3.5 text-[14px] text-muted hover:bg-glass hover:text-text"
              >
                {s.label}
              </button>
            ))}
          </div>
          {returning && latest && (
            <Link
              href={`/talk?resume=${latest.session.id}`}
              className="press mt-[18px] flex min-h-[52px] items-center gap-3 self-center rounded-pill border border-edge-lo bg-glass py-1.5 pr-[18px] pl-2 text-[14px] text-text no-underline hover:bg-glass-strong hover:text-text"
            >
              <span aria-hidden className="size-9 shrink-0 rounded-full" style={{ background: skyGradient(lastWeather ?? "quiet") }} />
              <span className="text-muted">Last time</span>
              <span className="max-w-[280px] truncate font-medium">{latest.reflection?.title ?? latest.session.title ?? "Our last conversation"}</span>
              <span className="font-semibold text-accent-strong">Pick up</span>
            </Link>
          )}
        </div>
      </div>
      <p className="relative m-0 px-12 pb-[18px] text-center text-[13px] text-faint">
        {BRAND.name} is an AI companion, not a clinician or an emergency service. If you&apos;re in danger, call {res.emergency}.
      </p>
      <ConsentSheet {...consentProps} />
    </AppShell>
  );
}
