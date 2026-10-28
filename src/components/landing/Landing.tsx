"use client";

import Link from "next/link";
import { useState } from "react";
import { LogoMark } from "@/components/brand/Logo";
import { ConsentSheet } from "@/components/consent/ConsentSheet";
import { Presence } from "@/components/presence/Presence";
import { HelpSheet } from "@/components/safety/HelpSheet";
import { HelpIcon, MicIcon, WriteIcon } from "@/components/ui/icons";
import { BRAND } from "@/lib/brand";
import { useStartConversation } from "@/lib/conversation/startConversation";
import { resourcesFor } from "@/lib/safety/resources";
import { useRegion } from "@/lib/safety/useRegion";
import { accountsEnabled } from "@/lib/supabase/config";

const talkBtn =
  "press flex min-h-14 items-center justify-center gap-2 rounded-pill bg-mic text-[17px] font-semibold text-mic-fg shadow-[0_8px_28px_rgba(63,214,205,.35)] hover:bg-mic-hover active:scale-[0.97]";
const writeBtn =
  "press flex min-h-14 items-center justify-center gap-2 rounded-pill border border-edge-hi bg-glass-strong text-[17px] font-semibold text-text backdrop-blur-[14px] hover:bg-glass-hover active:scale-[0.97]";

function StartButtons({ start, icons = false }: { start: (m: "voice" | "text") => void; icons?: boolean }) {
  return (
    <div className="grid w-full max-w-[420px] grid-cols-2 gap-2.5">
      <button type="button" onClick={() => start("voice")} className={talkBtn}>
        {icons && <MicIcon size={20} />}
        Talk
      </button>
      <button type="button" onClick={() => start("text")} className={writeBtn}>
        {icons && <WriteIcon size={20} />}
        Write
      </button>
    </div>
  );
}

/** The landing page for first-time visitors (README "Landing page"): hero, how it works, honest about what it is. */
export function Landing() {
  const { start, consentProps } = useStartConversation();
  const [helpOpen, setHelpOpen] = useState(false);
  const region = useRegion();
  const res = resourcesFor(region);
  const line = res.lines[0];
  const emergency = `call ${res.emergency}`;

  const panel = "relative overflow-hidden rounded-[clamp(0px,2.4vw,32px)]";
  return (
    <div className="flex flex-col gap-[clamp(12px,1.2vw,16px)] bg-ink-deep p-[clamp(0px,1.2vw,16px)] text-text">
      {/* Hero */}
      <section aria-labelledby="hero-h" className={`${panel} px-5 pb-[clamp(48px,5vw,80px)]`} style={{ background: "var(--lg-bg)" }}>
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div
            className="absolute right-[-10%] bottom-[-42%] left-[-10%] h-[70%] rounded-[50%]"
            style={{ background: "radial-gradient(closest-side, rgba(111,240,230,.55), rgba(26,168,181,.25) 50%, transparent)", filter: "blur(40px)" }}
          />
          <div
            className="absolute top-[22%] left-[-30%] h-[180px] w-[120%] rounded-[50%]"
            style={{ background: "var(--lg-streak-a)", filter: "blur(60px)", transform: "rotate(-12deg)" }}
          />
          <div
            className="absolute top-[46%] right-[-35%] h-[180px] w-[90%] rounded-[50%]"
            style={{ background: "var(--lg-streak-b)", filter: "blur(70px)", transform: "rotate(14deg)" }}
          />
        </div>
        <header className="relative z-[2] flex justify-center pt-[clamp(14px,1.6vw,22px)]">
          <nav aria-label="Main" className="flex w-full max-w-[720px] items-center gap-2 rounded-pill border border-edge-hi bg-glass py-1.5 pr-1.5 pl-3.5 backdrop-blur-[14px]">
            <Link href="/" className="flex min-h-11 items-center gap-[9px] text-[18px] font-semibold tracking-[-0.025em] text-text no-underline hover:text-text">
              <LogoMark />
              {BRAND.name}
            </Link>
            <span className="flex-1" />
            {accountsEnabled && (
              <Link href="/signin" className="hidden min-h-11 items-center px-3.5 text-[15px] text-muted no-underline hover:text-text min-[720px]:flex">
                Sign in
              </Link>
            )}
            <button
              type="button"
              onClick={() => setHelpOpen(true)}
              aria-haspopup="dialog"
              className="press flex min-h-11 items-center gap-1.5 rounded-pill bg-care-surface px-4 text-[15px] font-semibold whitespace-nowrap text-care"
            >
              <HelpIcon size={15} />
              Get help
            </button>
          </nav>
        </header>
        <div className="relative z-[1] mx-auto flex max-w-[820px] flex-col items-center text-center">
          <h1 id="hero-h" className="m-0 mt-[clamp(36px,5.4vw,76px)] text-[clamp(38px,5.6vw,72px)] leading-[1.04] font-semibold tracking-[-0.045em]">
            Somewhere quiet to think out loud
          </h1>
          <p className="m-0 mt-[clamp(14px,1.6vw,20px)] max-w-[560px] text-[clamp(17px,1.6vw,20px)] text-muted">
            A calm AI companion for untangling a thought, getting through a hard moment, or checking in with yourself.
          </p>
          <div className="mt-[clamp(20px,3vw,40px)]">
            <Presence state="idle" size={200} desktopSize={260} />
          </div>
          <div className="mt-[clamp(20px,2.6vw,32px)] flex w-full justify-center">
            <StartButtons start={start} icons />
          </div>
          {/* "Free to try" is left out until pricing is decided. */}
          <p className="m-0 mt-4 flex flex-wrap justify-center gap-x-3 gap-y-1 text-[14px]">
            <span>No account needed</span>
            <span aria-hidden className="opacity-50">
              ·
            </span>
            <span>Private by default</span>
          </p>
        </div>
      </section>

      {/* How it works */}
      <section aria-labelledby="how-h" className="mx-auto box-border flex w-full max-w-[1120px] flex-col gap-[clamp(24px,3vw,40px)] px-5 py-[clamp(48px,6vw,96px)]">
        <h2 id="how-h" className="t-h2 m-0 max-w-[620px]">
          Talk. Untangle it. Keep what matters.
        </h2>
        <ol className="m-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-3.5 p-0">
          <li className="flex flex-col gap-3.5 rounded-lg border border-edge-hi bg-glass px-[18px] pt-[18px] pb-[22px]">
            <div aria-hidden className="flex h-[150px] items-center justify-center rounded-md" style={{ background: "radial-gradient(circle at 50% 50%, rgba(63,214,205,.22), transparent 62%), #0b2a35" }}>
              <Presence state="listening" size={118} />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="m-0 text-[20px] font-semibold tracking-[-0.02em]">Say it however it comes out</h3>
              <p className="m-0 text-[15px] text-muted">Talk out loud or write. No chat bubbles. Just you, the orb, and quiet captions.</p>
            </div>
          </li>
          <li className="flex flex-col gap-3.5 rounded-lg border border-edge-hi bg-glass px-[18px] pt-[18px] pb-[22px]">
            <div aria-hidden className="flex h-[150px] flex-col justify-center gap-2.5 overflow-hidden rounded-md bg-ink px-[18px] py-4">
              <span className="text-[14px] text-muted">Everyone I know is getting jobs.</span>
              <span className="text-[17px] leading-[1.3] font-medium tracking-[-0.01em]">I&apos;m with you. How has that been showing up day to day?</span>
              <span className="flex gap-1.5">
                <span className="rounded-pill bg-glass-strong px-2.5 py-1 text-[12px]">Just listen</span>
                <span className="rounded-pill border border-edge-lo px-2.5 py-1 text-[12px] text-muted">Help me find a next step</span>
              </span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="m-0 text-[20px] font-semibold tracking-[-0.02em]">Get the help you need right now</h3>
              <p className="m-0 text-[15px] text-muted">Ask it to just listen, help you make sense of things, or find one small next step.</p>
            </div>
          </li>
          <li className="flex flex-col gap-3.5 rounded-lg border border-edge-hi bg-glass px-[18px] pt-[18px] pb-[22px]">
            <div aria-hidden className="flex h-[150px] flex-col gap-2 overflow-hidden rounded-md bg-ink p-3">
              <span className="h-[46px] shrink-0 rounded-[10px]" style={{ background: "linear-gradient(160deg,#b8a8ff,#4f7dff 45%,#6ff0e6)" }} />
              <span className="text-[15px] font-semibold tracking-[-0.01em]">A better conversation with Maya</span>
              <span className="border-l-2 border-[rgba(143,240,232,.4)] pl-2.5 text-[13px] text-muted">&ldquo;Honestly it felt good to just say it.&rdquo;</span>
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="m-0 text-[20px] font-semibold tracking-[-0.02em]">Leave with a card and a sky</h3>
              <p className="m-0 text-[15px] text-muted">Every conversation becomes a short reflection. It remembers what matters, and you can see or delete all of it.</p>
            </div>
          </li>
        </ol>
      </section>

      {/* Honest about what it is */}
      <section aria-labelledby="end-h" className={`${panel} px-5 pt-[clamp(48px,6vw,88px)] pb-[clamp(28px,3vw,40px)]`} style={{ background: "var(--lg-bg)" }}>
        <div
          aria-hidden
          className="absolute top-[-55%] right-[-10%] left-[-10%] h-[80%] rounded-[50%]"
          style={{ background: "radial-gradient(closest-side, rgba(111,240,230,.38), transparent)", filter: "blur(40px)" }}
        />
        <div className="relative mx-auto flex max-w-[1000px] flex-col items-center gap-[clamp(20px,2.4vw,28px)] text-center">
          <h2 id="end-h" className="t-h2 m-0">
            Honest about what it is
          </h2>
          <ul className="m-0 grid w-full list-none grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-2.5 p-0 text-left">
            <li className="flex flex-col gap-1 rounded-md border border-edge-lo bg-glass px-[18px] py-4">
              <strong className="text-base font-semibold">Private by default</strong>
              <span className="text-[15px] text-muted">Never sold, never used for ads. Without an account, everything stays on your device.</span>
            </li>
            <li className="flex flex-col gap-1 rounded-md border border-edge-lo bg-glass px-[18px] py-4">
              <strong className="text-base font-semibold">An AI, not a therapist</strong>
              <span className="text-[15px] text-muted">It listens and helps you reflect. It can&apos;t diagnose or give medical advice.</span>
            </li>
            <li className="flex flex-col gap-1 rounded-md border border-[rgba(220,207,255,.28)] bg-care-surface px-[18px] py-4">
              <strong className="text-base font-semibold text-care">Not for emergencies</strong>
              <span className="text-[15px] text-text">
                If you might be in danger,{" "}
                {line?.call ? (
                  <>
                    {line.text ? "call or text" : "call"} <strong className="font-semibold">{line.callDisplay ?? line.call}</strong>, or {emergency}.
                  </>
                ) : (
                  <>{emergency}.</>
                )}{" "}
                <button type="button" onClick={() => setHelpOpen(true)} className="bg-transparent p-0 font-semibold text-care underline underline-offset-2">
                  Get help
                </button>
              </span>
            </li>
          </ul>
          <div className="mt-2 flex w-full justify-center">
            <StartButtons start={start} />
          </div>
          <footer className="mt-[clamp(24px,3vw,40px)] flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-edge-lo pt-[18px]">
            <span className="flex items-center gap-2 text-[15px] font-semibold">
              <LogoMark size={18} />
              {BRAND.name}
            </span>
            <nav aria-label="Footer" className="flex flex-wrap gap-x-1">
              {[
                ["/privacy", "Privacy"],
                ["/terms", "Terms"],
                ...(accountsEnabled ? [["/signin", "Sign in"]] : []),
              ].map(([href, label]) => (
                <Link key={href} href={href} className="flex min-h-11 items-center px-2.5 text-[14px] text-muted no-underline hover:text-text">
                  {label}
                </Link>
              ))}
            </nav>
          </footer>
        </div>
      </section>

      <ConsentSheet {...consentProps} />
      <HelpSheet open={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}
