"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ConsentSheet } from "@/components/consent/ConsentSheet";
import { Presence } from "@/components/presence/Presence";
import { Backdrop } from "@/components/shell/Backdrop";
import { Dock, DockMic, DockSide } from "@/components/shell/Dock";
import { TopBar } from "@/components/shell/TopBar";
import { BreatheIcon, LockIcon, MicIcon, SkiesIcon, SparkIcon, WriteIcon } from "@/components/ui/icons";
import { BRAND } from "@/lib/brand";
import { useStartConversation } from "@/lib/conversation/startConversation";
import { WEATHER_LABELS } from "@/lib/conversation/types";
import { useStore } from "@/lib/data/StoreProvider";
import type { Reflection, Session } from "@/lib/data/types";
import { skyGradient } from "@/lib/design/skies";
import { timeOfDayGreeting } from "@/lib/greeting";
import { useIsWide } from "@/lib/useIsDesktop";
import { DesktopHome } from "./DesktopHome";

const weekday = new Intl.DateTimeFormat(undefined, { weekday: "long" });

const PROMISES = [
  { t: "Remembers you, and shows you what", Icon: SparkIcon },
  { t: "A sky for every talk", Icon: SkiesIcon },
  { t: "Private, never sold", Icon: LockIcon },
];

/** Phone and tablet Home; 1024px and up uses the desktop shell. */
export function Home() {
  return useIsWide() ? <DesktopHome /> : <PhoneHome />;
}

function PhoneHome() {
  const router = useRouter();
  const { store, profile } = useStore();
  const { start, consentProps } = useStartConversation();
  const [latest, setLatest] = useState<{ session: Session; reflection: Reflection | null } | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [session] = await store.listSessions(1);
      const reflection = session ? await store.getReflection(session.id) : null;
      if (cancelled) return;
      setLatest(session ? { session, reflection } : null);
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [store]);

  const returning = loaded && latest !== null;
  const lastWeather = latest?.reflection?.weather ?? latest?.session.weather ?? null;
  const lastTitle = latest?.reflection?.title ?? latest?.session.title ?? "Our last conversation";
  const name = profile?.displayName;

  return (
    <div className="relative flex h-dvh min-h-[600px] flex-col overflow-hidden">
      <Backdrop />
      <TopBar variant="home" />

      {returning && latest ? (
        <main className="relative z-[1] flex min-h-0 flex-1 flex-col items-center px-5 text-center">
          <div className="mt-[clamp(8px,2vw,26px)]">
            <Presence state="idle" size={170} desktopSize={220} />
          </div>
          <p className="m-0 mt-[clamp(10px,1.6vw,18px)] flex flex-wrap items-center justify-center gap-x-2 text-[15px] text-muted">
            <span>
              {timeOfDayGreeting()}
              {name ? `, ${name}` : ""}
            </span>
            {lastWeather && (
              <>
                <span aria-hidden className="size-[3px] rounded-full bg-current" />
                <span>Today feels like {WEATHER_LABELS[lastWeather].toLowerCase()}</span>
              </>
            )}
          </p>
          <h1 className="m-0 mt-1 text-[clamp(32px,3.8vw,48px)] leading-[1.08] font-semibold tracking-[-0.04em]">How are you, really?</h1>
          <Link
            href={`/talk?resume=${latest.session.id}`}
            className="press mt-5 flex min-h-[72px] w-full max-w-[440px] items-center gap-3.5 rounded-md border border-edge-hi bg-glass py-3 pr-3.5 pl-3 text-left text-text no-underline backdrop-blur-[14px] hover:bg-glass-strong hover:text-text"
          >
            <span aria-hidden className="size-11 shrink-0 rounded-[12px]" style={{ background: skyGradient(lastWeather ?? "quiet") }} />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-[13px] text-muted">Last time · {weekday.format(new Date(latest.session.startedAt))}</span>
              <span className="truncate text-base font-medium">{lastTitle}</span>
            </span>
            <span className="text-[14px] font-semibold whitespace-nowrap text-accent-strong">Pick up</span>
          </Link>
          <div className="flex-1" />
        </main>
      ) : (
        <main className={`relative z-[1] flex min-h-0 flex-1 flex-col items-center px-6 text-center ${loaded ? "" : "invisible"}`}>
          <div className="mt-[clamp(12px,2.6vw,32px)]">
            <Presence state="idle" size={170} desktopSize={220} />
          </div>
          <h1 className="t-screen-h1 m-0 mt-[clamp(12px,1.8vw,20px)] max-w-[620px]">Somewhere quiet to think out loud</h1>
          <p className="m-0 mt-2.5 max-w-[500px] text-[clamp(16px,1.4vw,18px)] text-muted">
            Untangle a thought, get through a hard moment, or check in with yourself. Talk it out or write it down.
          </p>
          <ul className="m-0 mt-[18px] flex list-none flex-wrap justify-center gap-2 p-0">
            {PROMISES.map(({ t, Icon }) => (
              <li key={t} className="flex min-h-9 items-center gap-2 rounded-pill border border-edge-lo bg-glass px-3.5 text-[14px] text-muted">
                <Icon size={15} className="text-accent-strong" />
                {t}
              </li>
            ))}
          </ul>
          <div className="flex-1" />
          <p className="m-0 mb-[72px] max-w-[460px] text-[13px] leading-[1.45] text-faint">
            {BRAND.name} is an AI companion for everyday reflection. It isn&apos;t a clinician or an emergency service. If you&apos;re in danger, call
            your local emergency number.
          </p>
        </main>
      )}

      <Dock
        className="z-[1] mb-[max(30px,env(safe-area-inset-bottom))]"
        left={
          <DockSide label="Write" ariaLabel="Write instead" onClick={() => start("text")}>
            <WriteIcon size={22} />
          </DockSide>
        }
        center={
          <DockMic ariaLabel={`Talk to ${BRAND.name}`} label="Tap to talk" onClick={() => start("voice")}>
            <MicIcon size={28} />
          </DockMic>
        }
        right={
          <DockSide label="Slow down" ariaLabel="Help me slow down" onClick={() => router.push("/breathe")}>
            <BreatheIcon size={22} />
          </DockSide>
        }
      />

      <ConsentSheet {...consentProps} />
    </div>
  );
}
