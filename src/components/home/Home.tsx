"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ConsentSheet } from "@/components/consent/ConsentSheet";
import { Presence } from "@/components/presence/Presence";
import { TopBar } from "@/components/shell/TopBar";
import { Sky } from "@/components/sky/Sky";
import { Button } from "@/components/ui/Button";
import { KeyboardIcon, MicIcon } from "@/components/ui/icons";
import { BRAND } from "@/lib/brand";
import { useStartConversation } from "@/lib/conversation/startConversation";
import type { Tone, Weather } from "@/lib/conversation/types";
import { useStore } from "@/lib/data/StoreProvider";
import type { Reflection, Session } from "@/lib/data/types";
import { timeOfDayGreeting } from "@/lib/greeting";

const DAY_MS = 24 * 60 * 60 * 1000;

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
    <div className="relative min-h-dvh overflow-hidden">
      <Sky weather={weather} />
      <div className="relative flex min-h-dvh flex-col">
        <TopBar transparent />

        <main className="flex flex-1 flex-col items-center px-4 pb-16">
          <section className="flex w-full max-w-xl flex-1 flex-col items-center justify-center gap-6 py-6 text-center">
            <Presence state="idle" tone={tone} className="w-[min(72vw,20rem)]" />
            <div className="min-h-[5.5rem]">
              {returning ? (
                <>
                  <h1 className="font-display text-3xl sm:text-4xl">
                    {timeOfDayGreeting()}
                    {name ? `, ${name}` : ""}.
                  </h1>
                  <p className="mt-2 text-lg text-muted">How are you, really?</p>
                </>
              ) : (
                <>
                  <h1 className="font-display text-3xl sm:text-4xl">Hello. I&apos;m here to listen.</h1>
                  <p className="mt-2 text-lg text-muted">Talk through your day, untangle a thought, or just breathe.</p>
                </>
              )}
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Button variant="primary" size="lg" onClick={() => start("voice")} className="justify-center">
                <MicIcon /> Talk
              </Button>
              <Button variant="secondary" size="lg" onClick={() => start("text")} className="justify-center">
                <KeyboardIcon /> Write
              </Button>
            </div>
          </section>

          {returning && reflection && (
            <section aria-labelledby="last-reflection" className="w-full max-w-xl">
              <h2 id="last-reflection" className="mb-2 text-xs uppercase tracking-widest text-faint">
                Last time
              </h2>
              <Link
                href={`/history/${reflection.sessionId}`}
                className="block rounded-lg border border-border bg-surface p-5 backdrop-blur transition-colors hover:bg-surface-strong"
              >
                <p className="font-display text-xl">{reflection.title}</p>
                <p className="mt-2 text-muted">{reflection.insight}</p>
                {reflection.nextStep && <p className="mt-3 text-sm text-accent">Next step: {reflection.nextStep}</p>}
              </Link>
              <div className="mt-4 flex justify-center gap-6 text-sm text-muted">
                <Link href="/history" className="hover:text-text">Your skies</Link>
                <Link href="/patterns" className="hover:text-text">Your patterns</Link>
                <Link href="/breathe" className="hover:text-text">Breathe</Link>
              </div>
            </section>
          )}

          {loaded && !returning && (
            <section className="grid w-full max-w-3xl gap-4 sm:grid-cols-3">
              {[
                ["Talk or write", "Say what's on your mind out loud, or type it. Either way, no chat bubbles — just a calm presence that listens."],
                ["See how you've been", "Every conversation becomes a sky and a reflection card, so you can see your weeks at a glance."],
                ["Remembers you", "Like a counselor's notes, I remember what matters to you. You can see and edit all of it."],
              ].map(([title, body]) => (
                <div key={title} className="rounded-lg border border-border bg-surface p-5 backdrop-blur">
                  <h2 className="font-display text-lg">{title}</h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
                </div>
              ))}
            </section>
          )}
        </main>

        <footer className="relative px-4 pb-6 text-center text-xs text-faint">
          <p>
            {BRAND.name} is an AI companion, not a therapist, and not for emergencies.
          </p>
          <p className="mt-2 flex justify-center gap-4">
            <Link href="/privacy" className="hover:text-text">Privacy</Link>
            <Link href="/terms" className="hover:text-text">Terms</Link>
          </p>
        </footer>
      </div>
      <ConsentSheet {...consentProps} />
    </div>
  );
}
