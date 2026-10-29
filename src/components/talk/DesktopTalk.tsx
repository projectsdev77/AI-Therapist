"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { pickCaptions } from "@/components/captions/Captions";
import { Presence } from "@/components/presence/Presence";
import { HELP_SUBTITLE, HelpContent } from "@/components/safety/HelpSheet";
import { useShell } from "@/components/shell/AppShell";
import { AlertIcon, BreatheIcon, CheckIcon, HelpIcon, MicIcon, MicOffIcon, PauseIcon, StyleIcon, WriteIcon } from "@/components/ui/icons";
import { STARTERS, type Starter } from "@/lib/conversation/starters";
import { SUPPORT_STYLE_LABELS, SUPPORT_STYLE_OPTIONS, type PresenceState, type SupportStyle, type Weather } from "@/lib/conversation/types";
import type { Conversation } from "@/lib/conversation/useConversation";
import type { SessionMode } from "@/lib/data/types";
import { skyGradient } from "@/lib/design/skies";
import type { Voice } from "@/lib/voice/useVoice";
import { TextComposer } from "./TextComposer";
import { micLook } from "./VoiceControls";

/**
 * The conversation in the desktop shell (desktop handoff "talk-*"): a header with the
 * conversation's sky, title and status; a readable conversation (writing) or the orb with
 * captions (talking); and a side panel with the orb, reply style and transcript.
 */

export interface DesktopTalkProps {
  convo: Conversation;
  voice: Voice;
  mode: SessionMode;
  presence: PresenceState;
  status: string;
  weather: Weather | null;
  voiceActive: boolean;
  voiceOff: boolean;
  voiceBlocked: boolean;
  showPill: boolean;
  showStarters: boolean;
  ack: string | null;
  onStartVoice: () => void;
  onSwitchMode: (mode: SessionMode) => void;
  onSend: (text: string) => void;
  onWrapUp: () => void;
  onBreathe: () => void;
  onChooseStyle: (style: SupportStyle | null) => void;
  onStarter: (starter: Starter) => void;
}

const label = "m-0 text-[12px] font-semibold tracking-[.06em] text-faint uppercase";
const time = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });

function useMinutes(startedAt: string | undefined) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);
  if (!startedAt) return null;
  return Math.max(0, Math.round((now - Date.parse(startedAt)) / 60_000));
}

export function DesktopTalkHeader({ convo, mode, status, weather, onSwitchMode, onWrapUp, compact }: DesktopTalkProps & { compact: boolean }) {
  const minutes = useMinutes(convo.session?.startedAt);
  const sub = [
    mode === "voice" ? "Talking" : "Writing",
    minutes === null ? null : minutes < 1 ? "just now" : `${minutes} min`,
    convo.supportStyle ? SUPPORT_STYLE_LABELS[convo.supportStyle] : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <header className={`relative flex shrink-0 items-center gap-3.5 border-b border-edge-lo py-3.5 pl-7 ${compact ? "pr-[76px]" : "pr-7"}`}>
      <span aria-hidden className="size-7 shrink-0 rounded-full" style={{ background: skyGradient(weather ?? "quiet") }} />
      <div className="flex min-w-0 flex-1 flex-col leading-[1.3]">
        <span className="truncate text-base font-semibold">{convo.resumed && convo.session?.title ? convo.session.title : "This conversation"}</span>
        <span className="text-[13px] text-muted">{sub}</span>
      </div>
      <span role="status" className="flex min-h-8 items-center gap-2 rounded-pill bg-glass px-3 text-[13px] whitespace-nowrap text-muted">
        <span aria-hidden className="size-[7px] rounded-full bg-accent" />
        {status}
      </span>
      {mode === "text" ? (
        <button
          type="button"
          onClick={() => onSwitchMode("voice")}
          title="Switch to talking (Space)"
          className="press flex min-h-10 items-center gap-1.5 rounded-pill border border-edge-hi px-3.5 text-[14px] text-text hover:bg-glass"
        >
          <MicIcon size={16} />
          Talk
        </button>
      ) : (
        <button
          type="button"
          onClick={() => onSwitchMode("text")}
          title="Switch to writing (W)"
          className="press flex min-h-10 items-center gap-1.5 rounded-pill border border-edge-hi px-3.5 text-[14px] text-text hover:bg-glass"
        >
          <WriteIcon size={16} />
          Write
        </button>
      )}
      <button
        type="button"
        onClick={onWrapUp}
        aria-haspopup="dialog"
        aria-label="Wrap up this conversation"
        title="Wrap up (Esc)"
        className="press flex min-h-10 items-center gap-1.5 rounded-pill border border-edge-hi bg-glass-strong px-4 text-[14px] font-medium whitespace-nowrap text-text hover:bg-glass-hover"
      >
        <CheckIcon size={16} strokeWidth={1.8} />
        Wrap up
      </button>
    </header>
  );
}

function SupportOptions() {
  const shell = useShell();
  return (
    <button
      type="button"
      onClick={() => shell?.openHelp()}
      className="press flex min-h-10 items-center gap-2 rounded-pill border border-[rgba(220,207,255,.35)] bg-care-surface px-4 text-[14px] font-semibold text-care"
    >
      <HelpIcon size={15} />
      Support options
    </button>
  );
}

/** Writing: the conversation reads top to bottom, newest reply largest. */
export function DesktopWriting(p: DesktopTalkProps) {
  const { convo } = p;
  const listRef = useRef<HTMLDivElement>(null);
  const lastText = convo.lines.at(-1)?.text;
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lastText, convo.slow, convo.error, p.ack, p.showPill]);

  const lastCompanion = convo.lines.findLastIndex((l) => l.speaker === "companion");
  const failed = Boolean(convo.error) && convo.phase === "idle" && convo.lines.at(-1)?.speaker === "user";
  const typing = convo.phase === "waiting" && !convo.slow && convo.lines.at(-1)?.speaker === "user";

  return (
    <>
      <div ref={listRef} className="relative flex min-h-0 flex-1 flex-col overflow-y-auto px-10 pt-6">
        <ol aria-live="polite" className="m-0 mx-auto mt-auto flex w-full max-w-[680px] list-none flex-col gap-5 p-0 pb-2">
          {convo.lines.map((l, i) => {
            const haven = l.speaker === "companion";
            const last = i === convo.lines.length - 1;
            if (haven && !l.text) return null;
            return (
              <li key={l.id} className={`flex flex-col gap-1 ${haven ? "items-start" : "items-end"}`}>
                <span className={`text-[12px] font-semibold ${haven ? "text-accent-strong" : "text-faint"}`}>{haven ? "Haven" : "You"}</span>
                {haven ? (
                  <p
                    className={`m-0 leading-[1.45] font-medium tracking-[-0.015em] text-pretty ${
                      i === lastCompanion ? "text-[24px] text-text" : "text-[19px] text-[rgba(239,252,250,.82)]"
                    }`}
                  >
                    {l.text}
                  </p>
                ) : (
                  <p
                    className={`m-0 max-w-[80%] rounded-[20px_20px_6px_20px] bg-glass px-4 py-2.5 text-base leading-[1.45] text-pretty text-muted ${
                      failed && last ? "border border-dashed border-[rgba(255,196,184,.5)]" : ""
                    }`}
                  >
                    {l.text}
                  </p>
                )}
              </li>
            );
          })}
          {failed && (
            <li className="-mt-3 self-end">
              <div role="alert" className="flex items-center gap-1.5 self-end text-[13px] text-danger">
              <AlertIcon size={15} />
              Didn&apos;t send. Your words are safe.
              <button type="button" onClick={convo.retry} className="press min-h-9 rounded-pill bg-mic px-3 text-[13px] font-semibold text-mic-fg hover:bg-mic-hover">
                Try again
              </button>
            </div>
            </li>
          )}
          {convo.error && !failed && convo.phase === "idle" && (
            <li>
              <div role="alert" className="flex items-center gap-2 text-[14px] text-danger">
              <AlertIcon size={15} />
              Something went wrong.
              <button type="button" onClick={convo.retry} className="press min-h-9 rounded-pill bg-mic px-3 text-[13px] font-semibold text-mic-fg hover:bg-mic-hover">
                Try again
              </button>
            </div>
            </li>
          )}
          {convo.slow && (
            <li>
              <div role="status" className="flex flex-wrap items-center gap-3">
              <span aria-hidden className="pulse-dot-slow size-2 rounded-full bg-accent" />
              <span className="text-[17px] text-muted">Taking a little longer than usual…</span>
              <button
                type="button"
                onClick={convo.cancelReply}
                className="press min-h-9 rounded-pill border border-edge-hi bg-glass-strong px-3.5 text-[13px] font-medium text-text"
              >
                Stop waiting
              </button>
            </div>
            </li>
          )}
          {typing && (
            <li aria-hidden className="flex gap-1.5 py-1">
              {[0, 0.2, 0.4].map((d) => (
                <span key={d} className="pulse-dot size-2 rounded-full bg-accent" style={{ animationDelay: `${d}s` }} />
              ))}
            </li>
          )}
          {p.ack && (
            <li>
              <div role="status" className="flex items-center gap-2 text-[14px] text-muted">
              <StyleIcon size={16} className="text-accent-strong" />
              {p.ack}
            </div>
            </li>
          )}
          {p.showPill && (
            <li>
              <SupportOptions />
            </li>
          )}
          {p.showStarters && (
            <li>
              <div role="group" aria-label="Ways to start" className="flex flex-wrap gap-1.5">
              {STARTERS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => p.onStarter(s)}
                  className="press min-h-10 rounded-pill border border-edge-lo px-3.5 text-[14px] text-muted hover:bg-glass hover:text-text"
                >
                  {s.label}
                </button>
              ))}
            </div>
            </li>
          )}
        </ol>
      </div>
      <div className="relative flex shrink-0 justify-center px-10 pt-4 pb-5">
        <div className="flex w-full max-w-[720px] flex-col gap-2">
          <TextComposer onSend={p.onSend} onSwitchToVoice={() => p.onSwitchMode("voice")} spaceToTalk />
          <p className="m-0 mx-3 flex flex-wrap gap-4 text-[12px] text-faint">
            <span>
              <kbd className="font-mono">Enter</kbd> send
            </span>
            <span>
              <kbd className="font-mono">Shift+Enter</kbd> new line
            </span>
            <span>
              <kbd className="font-mono">Space</kbd> on an empty box to talk
            </span>
            <span>
              <kbd className="font-mono">Esc</kbd> wrap up
            </span>
          </p>
        </div>
      </div>
    </>
  );
}

/** Talking: a large orb, captions, and a floating control bar (Mute · mic · Breathe). */
export function DesktopVoice(p: DesktopTalkProps) {
  const { voice, convo } = p;
  const look = micLook(voice);
  const live = p.voiceActive;
  const view = pickCaptions(voice.partial ? [...convo.lines, { id: "partial", speaker: "user", text: voice.partial, pending: true }] : convo.lines);

  let icon: ReactNode = <MicIcon size={28} />;
  let aria = "Start talking";
  let hint = convo.session ? "Press the mic or Space to keep talking" : "I'll say hello first · press Space when you're ready";
  let action = p.onStartVoice;
  if (live && look === "listening") {
    icon = [0, 0.15, 0.3, 0.45, 0.6].map((d) => <span key={d} className="mic-bar block h-[22px] w-1 rounded-[2px] bg-current" style={{ animationDelay: `${d}s` }} />);
    aria = "Listening. Press to pause";
    hint = "Listening · Space to pause · M to mute";
    action = () => voice.setMuted(true);
  } else if (live && look === "speaking") {
    icon = <PauseIcon size={26} />;
    aria = "Haven is speaking. Press to interrupt";
    hint = "Speak anytime to interrupt · Space to pause";
    action = voice.interrupt;
  } else if (live && voice.muted) {
    aria = "Paused. Press to keep talking";
    hint = "Paused · Space to keep talking";
    action = () => voice.setMuted(false);
  } else if (live) {
    aria = voice.status === "thinking" || voice.status === "transcribing" ? "Thinking" : "Listening";
    hint = "Space to pause · M to mute";
    action = () => undefined;
  }

  return (
    <>
      <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-[22px] overflow-y-auto px-12 py-6 text-center">
        <Presence state={p.presence} size={250} getLevel={live ? voice.getLevel : undefined} />
        <div aria-live="polite" className="flex w-full max-w-[720px] flex-col items-center gap-3">
          {p.voiceOff && !p.voiceBlocked && !convo.session ? (
            <p className="m-0 text-[30px] leading-[1.3] font-medium tracking-[-0.02em] text-balance">I&apos;ll say hello first. Press the mic whenever you&apos;re ready.</p>
          ) : (
            <>
              {view.prev && (
                <p aria-hidden className="m-0 text-[17px] opacity-30 blur-[1px]">
                  {view.prev.text}
                </p>
              )}
              {view.person && <p className="m-0 text-[19px] text-muted">{view.person.text}</p>}
              {view.companion && <p className="m-0 text-[30px] leading-[1.3] font-medium tracking-[-0.02em] text-balance">{view.companion.text}</p>}
            </>
          )}
          {p.ack && (
            <p role="status" className="m-0 flex items-center gap-2 text-[15px] text-muted">
              <StyleIcon size={16} className="text-accent-strong" />
              {p.ack}
            </p>
          )}
          {convo.slow && (
            <p role="status" className="m-0 flex flex-wrap items-center justify-center gap-3 text-[17px] text-muted">
              Taking a little longer than usual…
              <button type="button" onClick={convo.cancelReply} className="press min-h-9 rounded-pill border border-edge-hi bg-glass-strong px-3.5 text-[13px] text-text">
                Stop waiting
              </button>
            </p>
          )}
          {convo.error && convo.phase === "idle" && (
            <p role="alert" className="m-0 flex items-center gap-2 text-[15px] text-danger">
              <AlertIcon size={15} />
              That didn&apos;t send. Your words are still here.
              <button type="button" onClick={convo.retry} className="press min-h-9 rounded-pill bg-mic px-3 text-[13px] font-semibold text-mic-fg">
                Try again
              </button>
            </p>
          )}
          {p.voiceBlocked && (
            <p role="alert" className="m-0 flex items-center gap-2 text-[15px]">
              <AlertIcon size={15} className="text-accent-strong" />
              {voice.error ?? "Voice isn't available in this browser."}
              <button type="button" onClick={() => p.onSwitchMode("text")} className="press min-h-9 rounded-pill bg-mic px-3 text-[13px] font-semibold text-mic-fg">
                Write instead
              </button>
            </p>
          )}
          {p.showPill && <SupportOptions />}
          {p.showStarters && (
            <div role="group" aria-label="Ways to start" className="mt-1 flex flex-wrap justify-center gap-1.5">
              {STARTERS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => p.onStarter(s)}
                  className="press min-h-10 rounded-pill border border-edge-lo px-3.5 text-[14px] text-muted hover:bg-glass hover:text-text"
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="relative flex shrink-0 flex-col items-center gap-2.5 px-10 pb-6">
        <div className="flex items-center gap-[18px] rounded-pill border border-edge-hi bg-glass px-[18px] py-3 backdrop-blur-[18px]">
          <button
            type="button"
            onClick={() => voice.setMuted(!voice.muted)}
            disabled={!live}
            aria-label="Mute microphone"
            aria-pressed={voice.muted}
            title="Mute (M)"
            className="press flex size-[52px] items-center justify-center rounded-full border border-edge-hi bg-glass-strong text-text disabled:opacity-45"
          >
            <MicOffIcon size={20} />
          </button>
          <button
            type="button"
            onClick={action}
            aria-label={aria}
            title="Space"
            className={`press flex size-[72px] items-center justify-center gap-1 rounded-full bg-mic text-mic-fg shadow-[0_0_0_8px_rgba(160,250,240,.12),0_8px_22px_var(--lg-mic-shadow)] hover:bg-mic-hover ${
              live && look === "listening" ? "mic-pulse" : ""
            }`}
          >
            {icon}
          </button>
          <button
            type="button"
            onClick={p.onBreathe}
            aria-label="Help me slow down"
            title="Breathe (B)"
            className="press flex size-[52px] items-center justify-center rounded-full border border-edge-hi bg-glass-strong text-text"
          >
            <BreatheIcon size={20} />
          </button>
        </div>
        <p className="m-0 text-[13px] text-muted">{hint}</p>
      </div>
    </>
  );
}

/** The side panel: orb (writing), reply style, transcript tab (talking), Breathe and Get help. */
export function DesktopTalkPanel(p: DesktopTalkProps) {
  const shell = useShell();
  const [tab, setTab] = useState<"convo" | "transcript">("convo");
  const showTranscript = p.mode === "voice" && tab === "transcript";
  const lines = p.convo.lines.filter((l) => l.text && !l.pending);
  const [copied, setCopied] = useState(false);

  return (
    <>
      {p.mode === "voice" && (
        <div role="tablist" aria-label="Panel" className="grid grid-cols-2 gap-1 rounded-pill border border-edge-lo bg-glass p-1">
          {(
            [
              ["convo", "This conversation"],
              ["transcript", "Transcript"],
            ] as const
          ).map(([id, t]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`press min-h-9 rounded-pill text-[14px] ${tab === id ? "bg-glass-strong font-semibold text-text" : "text-muted"}`}
            >
              {t}
            </button>
          ))}
        </div>
      )}
      {p.mode === "text" && (
        <div className="flex justify-center pt-1">
          <Presence state={p.presence} size={150} />
        </div>
      )}
      {showTranscript ? (
        <>
          <ol aria-label="Conversation transcript" className="m-0 flex list-none flex-col gap-3.5 p-0">
            {lines.map((l) => {
              const haven = l.speaker === "companion";
              return (
                <li key={l.id} className={`flex flex-col gap-0.5 border-l-2 pl-3 ${haven ? "border-[rgba(143,240,232,.45)]" : "border-edge-lo"}`}>
                  <span className={`text-[12px] font-semibold ${haven ? "text-accent-strong" : "text-faint"}`}>
                    {haven ? "Haven" : "You"}
                    {l.at ? ` · ${time.format(l.at)}` : ""}
                  </span>
                  <span className={`text-[14px] text-pretty ${haven ? "text-text" : "text-muted"}`}>{l.text}</span>
                </li>
              );
            })}
          </ol>
          <button
            type="button"
            onClick={() => {
              void navigator.clipboard
                ?.writeText(lines.map((l) => `${l.speaker === "companion" ? "Haven" : "You"}: ${l.text}`).join("\n\n"))
                .then(() => setCopied(true), () => undefined);
            }}
            className="press min-h-10 self-start rounded-pill border border-edge-hi bg-glass-strong px-4 text-[14px] font-medium text-text"
          >
            {copied ? "Copied" : "Copy text"}
          </button>
        </>
      ) : (
        <section className="flex flex-col gap-2">
          <h2 id="style-heading" className={label}>
            What would help right now?
          </h2>
          <div role="radiogroup" aria-labelledby="style-heading" className="flex flex-col gap-0.5">
            {SUPPORT_STYLE_OPTIONS.map((o, i) => {
              const on = (p.convo.supportStyle ?? null) === o.id;
              return (
                <button
                  key={o.label}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => p.onChooseStyle(o.id)}
                  className={`press flex min-h-12 items-center gap-2.5 rounded-[12px] border px-3 text-left text-text hover:bg-glass ${
                    on ? "border-edge-hi bg-glass-strong" : "border-transparent"
                  }`}
                >
                  <span
                    aria-hidden
                    className={`size-4 shrink-0 rounded-full ${on ? "border-[5px] border-mic bg-mic-fg" : "border-[1.5px] border-faint"}`}
                  />
                  <span className="flex flex-1 flex-col leading-[1.3]">
                    <span className={`text-[14px] ${on ? "font-semibold" : ""}`}>{o.label}</span>
                    <span className="text-[12px] text-muted">{o.desc}</span>
                  </span>
                  <kbd className="font-mono text-[11px] text-faint">{i + 1}</kbd>
                </button>
              );
            })}
          </div>
          <p className="m-0 mx-0.5 text-[12px] text-faint">Applies from my next reply. You can also just ask.</p>
        </section>
      )}
      <div className="mt-auto grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={p.onBreathe}
          title="Breathe (B)"
          className="press flex min-h-11 items-center justify-center gap-2 rounded-[12px] border border-edge-lo bg-glass text-[14px] text-text hover:bg-glass-strong"
        >
          <BreatheIcon size={17} />
          Breathe
        </button>
        <button
          type="button"
          onClick={() => shell?.openHelp()}
          className="press min-h-11 rounded-[12px] border border-[rgba(220,207,255,.25)] bg-care-surface text-[14px] font-semibold text-care"
        >
          Get help
        </button>
      </div>
    </>
  );
}

/** Acute risk: the panel turns into the care panel by itself. The conversation stays usable beside it. */
export function DesktopCarePanel({ onSafe }: { onSafe: () => void }) {
  return (
    <div className="panel-in flex flex-col gap-3.5">
      <div className="flex flex-col gap-1">
        <h2 aria-live="assertive" className="m-0 text-[22px] leading-[1.2] font-semibold tracking-[-0.03em] text-balance text-care">
          You don&apos;t have to carry this alone
        </h2>
        <p className="m-0 text-[14px] text-muted">You can talk to someone right now, free, any time. I&apos;ll stay right here.</p>
      </div>
      <HelpContent footer={HELP_SUBTITLE} />
      <button
        type="button"
        onClick={onSafe}
        className="min-h-11 bg-transparent text-[14px] text-text underline decoration-[rgba(239,252,250,.35)] underline-offset-[3px]"
      >
        I&apos;m safe right now
      </button>
    </div>
  );
}
