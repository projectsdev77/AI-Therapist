"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { BreatheIcon, MicIcon, MicOffIcon, PauseIcon, SendIcon, WriteIcon } from "@/components/ui/icons";
import type { SessionMode } from "@/lib/data/types";
import type { Voice } from "@/lib/voice/useVoice";
import { micLook } from "./VoiceControls";

const round =
  "press flex size-12 shrink-0 items-center justify-center rounded-full border border-edge-lo bg-glass text-text hover:bg-glass-strong disabled:opacity-45 disabled:hover:bg-glass";
const primary =
  "press flex h-12 shrink-0 items-center gap-2 rounded-[24px] bg-mic pr-5 pl-4 text-[15px] font-semibold text-mic-fg shadow-[0_6px_18px_var(--lg-mic-shadow)] hover:bg-mic-hover disabled:opacity-60";

/**
 * Desktop: the same text box as Home, so Home and the conversation read as one place.
 * Writing: words, Breathe, and Talk (or Send once there's text). Talking: what's happening,
 * Mute, Breathe, and the mic (start, pause, keep talking, or interrupt).
 */
export function DesktopComposer({
  mode,
  voice,
  voiceActive,
  onSend,
  onStartVoice,
  onSwitchMode,
  onBreathe,
}: {
  mode: SessionMode;
  voice: Voice;
  voiceActive: boolean;
  onSend: (text: string) => void;
  onStartVoice: () => void;
  onSwitchMode: (mode: SessionMode) => void;
  onBreathe: () => void;
}) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const hasText = value.trim().length > 0;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 5 * 24 + 12)}px`;
  }, [value]);

  function submit() {
    const text = value.trim();
    if (!text) return;
    onSend(text);
    setValue("");
  }

  const breathe = (
    <button type="button" onClick={onBreathe} aria-label="Help me slow down" title="Breathe (B)" className={round}>
      <BreatheIcon size={20} />
    </button>
  );

  let left: ReactNode;
  let right: ReactNode;
  if (mode === "text") {
    left = (
      <>
        <label htmlFor="composer" className="sr-only">
          Write to your companion
        </label>
        <textarea
          id="composer"
          ref={ref}
          rows={1}
          value={value}
          autoFocus
          maxLength={4000}
          placeholder="Write what's on your mind, or press Space to talk"
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === " " && !value) {
              e.preventDefault();
              onSwitchMode("voice");
            } else if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              submit();
            }
          }}
          className="max-h-[132px] min-h-12 flex-1 resize-none self-center bg-transparent py-3 text-[17px] leading-6 text-text placeholder:text-faint focus:outline-none"
        />
      </>
    );
    right = hasText ? (
      <button type="button" onClick={submit} aria-label="Send" className={primary}>
        <SendIcon size={18} />
        Send
      </button>
    ) : (
      <>
        {breathe}
        <button type="button" onClick={() => onSwitchMode("voice")} aria-label="Switch to talking" title="Talk (Space)" className={primary}>
          <MicIcon size={18} />
          Talk
        </button>
      </>
    );
  } else {
    const look = micLook(voice);
    const thinking = voice.status === "thinking" || voice.status === "transcribing";
    let hint = "Press Talk when you're ready.";
    let main: ReactNode = (
      <>
        <MicIcon size={18} />
        Talk
      </>
    );
    let aria = "Start talking";
    let action: () => void = onStartVoice;
    if (voiceActive && look === "speaking") {
      hint = "Speak anytime to interrupt.";
      main = (
        <>
          <PauseIcon size={18} />
          Interrupt
        </>
      );
      aria = "Haven is speaking. Press to interrupt";
      action = voice.interrupt;
    } else if (voiceActive && voice.muted) {
      hint = "Paused. I'm not listening.";
      main = (
        <>
          <MicIcon size={18} />
          Keep talking
        </>
      );
      aria = "Paused. Press to keep talking";
      action = () => voice.setMuted(false);
    } else if (voiceActive && thinking) {
      hint = "Thinking…";
      aria = "Thinking";
      main = <>Thinking</>;
      action = () => undefined;
    } else if (voiceActive) {
      hint = "Listening… speak whenever you're ready.";
      main = (
        <>
          <span aria-hidden className="flex items-center gap-[3px]">
            {[0, 0.15, 0.3, 0.45].map((d) => (
              <span key={d} className="mic-bar block h-4 w-[3px] rounded-[2px] bg-current" style={{ animationDelay: `${d}s` }} />
            ))}
          </span>
          Pause
        </>
      );
      aria = "Listening. Press to pause";
      action = () => voice.setMuted(true);
    }
    left = (
      <p aria-live="polite" className="m-0 flex-1 text-left text-[17px] text-muted">
        {hint}
      </p>
    );
    right = (
      <>
        <button type="button" onClick={() => onSwitchMode("text")} aria-label="Switch to writing" title="Write (W)" className={round}>
          <WriteIcon size={20} />
        </button>
        <button
          type="button"
          onClick={() => voice.setMuted(!voice.muted)}
          disabled={!voiceActive}
          aria-label="Mute microphone"
          aria-pressed={voice.muted}
          title="Mute (M)"
          className={round}
        >
          <MicOffIcon size={20} />
        </button>
        {breathe}
        <button type="button" onClick={action} aria-label={aria} title="Space" className={primary}>
          {main}
        </button>
      </>
    );
  }

  return (
    <div
      className="flex min-h-16 items-center gap-2.5 rounded-[32px] border border-edge-hi py-2 pr-2 pl-[22px] shadow-[0_18px_50px_rgba(0,0,0,.25)] backdrop-blur-[18px] focus-within:border-[rgba(143,240,232,.45)]"
      style={{ background: "rgba(8,30,40,.55)" }}
    >
      {left}
      {right}
    </div>
  );
}
