"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ConsentSheet } from "@/components/consent/ConsentSheet";
import { Presence } from "@/components/presence/Presence";
import { Backdrop } from "@/components/shell/Backdrop";
import { TopBar } from "@/components/shell/TopBar";
import { Button } from "@/components/ui/Button";
import { MicIcon, WriteIcon } from "@/components/ui/icons";
import { BRAND } from "@/lib/brand";
import { useStartConversation } from "@/lib/conversation/startConversation";
import { WEATHER_LABELS, type Tone, type Weather } from "@/lib/conversation/types";
import { WEATHER_PHRASES } from "@/lib/conversation/weatherCopy";
import { useStore } from "@/lib/data/StoreProvider";
import type { Reflection, Session } from "@/lib/data/types";
import { timeOfDayGreeting } from "@/lib/greeting";

const DAY_MS = 24 * 60 * 60 * 1000;
const weekday = new Intl.DateTimeFormat(undefined, { weekday: "long" });

const VALUES = [
  { t: "It remembers you", d: "And shows you exactly what. Edit or erase anything." },
  { t: "Every talk, a sky", d: "Each conversation leaves a small sky and a card to keep." },
  { t: "Yours alone", d: "Private by default. Never sold, never used for ads." },
];

export function Home() {
  const { store, profile } = useStore();
  const { start, consentProps } = useStartConversation();
  const [latest, setLatest] = useState<Session | null>(null);
  const [reflection, setReflection] = useState<Reflection | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [session] = await store.listSessions(1);
      const [lastReflection] = await store.listReflections(1);
      if (cancelled) return;
      setLatest(session ?? null);
      setReflection(lastReflection ?? null);
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [store]);

  const returning = loaded && latest !== null;
  // eslint-disable-next-line react-hooks/purity -- recency check only needs to be approximately right
  const recent = latest && Date.now() - new Date(latest.startedAt).getTime() < DAY_MS;
  const weather: Weather | null = recent ? latest.weather : null;
  const tone: Tone = (recent && latest.toneEnd) || "neutral";
  const name = profile?.displayName;

  return (
    <div className="relative flex min-h-dvh flex-col">
      <Backdrop weather={weather} />
      <TopBar />

      {returning ? (
        <main className="relative mx-auto flex w-full max-w-[640px] flex-1 flex-col gap-6 px-4 pb-8">
          <div className="mt-5 flex flex-col gap-2">
            {weather && (
              <p className="flex items-center gap-2 text-sm text-muted">
                {/* eslint-disable-next-line @next/next/no-img-element -- tiny decorative SVG glyph */}
                <img src={`/weather/${weather}.svg`} alt="" width={18} height={18} className="opacity-80 dark:invert-0" />
                Today feels like {WEATHER_PHRASES[weather]}
              </p>
            )}
            <h1 className="heading heading-lg">
              {name ? (
                <>
                  {timeOfDayGreeting()}, <span className="accent">{name}.</span>
                </>
              ) : (
                <>
                  {timeOfDayGreeting()}. <span className="accent">How are you?</span>
                </>
              )}
            </h1>
          </div>
          <div className="flex justify-center">
            <Presence state="idle" tone={tone} className="w-[min(60vw,220px)]" />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <Button variant="primary" size="lg" onClick={() => start("voice")}>
              <MicIcon size={20} /> Talk
            </Button>
            <Button variant="primary" size="lg" onClick={() => start("text")}>
              <WriteIcon size={20} /> Write
            </Button>
          </div>
          {reflection && (
            <Link
              href={`/history/${reflection.sessionId}`}
              className="flex flex-col gap-1.5 rounded-lg border border-border bg-surface px-5 py-[18px] shadow-soft transition-colors duration-[var(--motion-base)] hover:bg-surface-strong"
            >
              <span className="text-sm text-muted">
                Last time · {weekday.format(new Date(reflection.createdAt))} · {WEATHER_LABELS[reflection.weather]}
              </span>
              <span className="text-xl font-light tracking-[-0.01em]">{reflection.title}</span>
              {reflection.quotes[0] && <span className="voice-person text-lg text-muted">&ldquo;{reflection.quotes[0]}&rdquo;</span>}
              <span className="mt-1 text-[15px] font-medium text-accent-strong">See this reflection</span>
            </Link>
          )}
        </main>
      ) : (
        <main className="relative mx-auto flex w-full max-w-[640px] flex-1 flex-col items-center gap-7 px-4 pb-8">
          <Presence state="idle" tone="neutral" className="mt-2 w-[240px] shrink-0" />
          <div className="-mt-3 flex flex-col gap-3 text-center">
            <h1 className="heading heading-lg">
              Hello. I&apos;m here to <span className="accent">listen.</span>
            </h1>
            <p className="text-[17px] text-muted text-pretty">
              Untangle a thought, get through a hard moment, or check in with yourself. Talk it out or write it down.
            </p>
          </div>
          <div className="grid w-full grid-cols-2 gap-2.5">
            {(
              [
                ["voice", "Talk", "Out loud", MicIcon],
                ["text", "Write", "In your own words", WriteIcon],
              ] as const
            ).map(([mode, title, sub, Icon]) => (
              <button
                key={mode}
                type="button"
                onClick={() => start(mode)}
                className="flex min-h-24 flex-col items-start justify-between rounded-lg bg-accent px-[18px] py-4 text-left text-on-accent transition-transform duration-[var(--motion-fast)] active:scale-[0.98]"
              >
                <Icon size={22} />
                <span className="flex flex-col">
                  <span className="text-lg font-medium">{title}</span>
                  <span className="text-sm opacity-85">{sub}</span>
                </span>
              </button>
            ))}
          </div>
          {loaded && (
            <div className="grid w-full grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-2.5">
              {VALUES.map((v) => (
                <div key={v.t} className="flex flex-col gap-1 rounded-md border border-border bg-surface px-[18px] py-4 shadow-soft">
                  <span className="voice-person text-[21px] leading-tight">{v.t}</span>
                  <span className="text-[15px] text-muted text-pretty">{v.d}</span>
                </div>
              ))}
            </div>
          )}
          <p className="max-w-[460px] text-center text-sm text-faint text-pretty">
            {BRAND.name} is an AI companion for everyday reflection. It isn&apos;t a clinician or an emergency service. If you&apos;re in danger,
            call your local emergency number.
          </p>
          <p className="-mt-4 flex gap-4 text-sm text-faint">
            <Link href="/privacy" className="hover:text-text">Privacy</Link>
            <Link href="/terms" className="hover:text-text">Terms</Link>
          </p>
        </main>
      )}
      <ConsentSheet {...consentProps} />
    </div>
  );
}
