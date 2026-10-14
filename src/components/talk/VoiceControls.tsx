"use client";

import { Button } from "@/components/ui/Button";
import { MicIcon, MicOffIcon, WriteIcon } from "@/components/ui/icons";
import type { Voice } from "@/lib/voice/useVoice";

const STATUS_TEXT: Partial<Record<Voice["status"], string>> = {
  starting: "Getting ready…",
  listening: "I'm listening",
  hearing: "I'm listening",
  transcribing: "Taking that in…",
  thinking: "Thinking…",
  speaking: "Speaking",
};

/** Before voice starts: a 64px start button (needed so iOS plays the greeting) and Write instead. */
export function VoiceStart({ voice, onStart, onSwitchToText }: { voice: Voice; onStart: () => void; onSwitchToText: () => void }) {
  const unavailable = !voice.supported || voice.status === "unsupported" || voice.status === "error";
  return (
    <div className="mx-auto flex w-full max-w-[600px] flex-col items-center gap-3.5 px-6 pb-11 text-center">
      {unavailable ? (
        <>
          <p className="voice-companion text-[23px]">Let&apos;s write instead.</p>
          <p role="alert" className="mb-2.5 text-[15px] text-muted">
            {voice.error ?? "Voice isn't available in this browser."}
          </p>
          <Button variant="primary" size="xl" onClick={onSwitchToText} className="w-full max-w-[340px]">
            <WriteIcon size={22} /> Write instead
          </Button>
        </>
      ) : (
        <>
          <p className="voice-companion text-[23px]">I&apos;ll say hello first.</p>
          <p className="mb-2.5 text-[15px] text-muted">Turn your sound on, then tap when you&apos;re ready.</p>
          <Button variant="primary" size="xl" onClick={onStart} className="w-full max-w-[340px]">
            <MicIcon size={22} /> Tap to start talking
          </Button>
          <Button variant="link" onClick={onSwitchToText} className="min-h-11 text-base">
            Write instead
          </Button>
        </>
      )}
    </div>
  );
}

/** While talking: live status, Mute, Write, End. */
export function VoiceBand({ voice, onSwitchToText, onEnd, ending }: { voice: Voice; onSwitchToText: () => void; onEnd: () => void; ending: boolean }) {
  const live = !voice.muted && (voice.status === "listening" || voice.status === "hearing");
  return (
    <div className="flex flex-col items-center gap-2.5">
      <div role="status" className="flex min-h-11 items-center gap-2.5 text-[17px] font-medium">
        {live && <span aria-hidden className="pulse-dot size-2 rounded-full bg-accent-strong" />}
        {voice.muted ? "Microphone is muted" : STATUS_TEXT[voice.status]}
      </div>
      <p className="-mt-2 mb-1 text-sm text-muted">
        {voice.muted ? "Unmute when you're ready" : "Speak anytime to interrupt"}
      </p>
      <div className="flex w-full justify-center gap-2">
        <Button
          variant="secondary"
          onClick={() => voice.setMuted(!voice.muted)}
          aria-pressed={voice.muted}
          className="min-h-[52px] !shadow-none"
        >
          {voice.muted ? <MicOffIcon size={18} /> : <MicIcon size={18} />}
          {voice.muted ? "Unmute" : "Mute"}
        </Button>
        <Button variant="secondary" onClick={onSwitchToText} className="min-h-[52px] !shadow-none">
          <WriteIcon size={18} /> Write
        </Button>
        <Button variant="ghost" onClick={onEnd} disabled={ending} className="min-h-[52px]">
          {ending ? "Ending…" : "End"}
        </Button>
      </div>
    </div>
  );
}
