"use client";

import { Button } from "@/components/ui/Button";
import { KeyboardIcon, MicIcon, MicOffIcon } from "@/components/ui/icons";
import type { Voice } from "@/lib/voice/useVoice";

const STATUS_TEXT: Partial<Record<Voice["status"], string>> = {
  starting: "Getting ready…",
  listening: "I'm listening",
  hearing: "I'm listening",
  transcribing: "Taking that in…",
  thinking: "Thinking…",
  speaking: "Speak anytime to interrupt",
};

export function VoiceControls({ voice, onStart, onSwitchToText }: { voice: Voice; onStart: () => void; onSwitchToText: () => void }) {
  if (!voice.supported || voice.status === "unsupported" || voice.status === "error") {
    return (
      <div className="flex w-full flex-col items-center gap-3 text-center">
        <p className="max-w-sm text-sm text-muted" role="alert">
          {voice.error ?? "Voice isn't available in this browser."}
        </p>
        <Button variant="primary" onClick={onSwitchToText}>
          <KeyboardIcon size={20} /> Write instead
        </Button>
      </div>
    );
  }

  if (voice.status === "off") {
    return (
      <div className="flex w-full flex-col items-center gap-3">
        <Button variant="primary" size="lg" onClick={onStart}>
          <MicIcon /> Tap to start talking
        </Button>
        <Button variant="ghost" onClick={onSwitchToText}>
          <KeyboardIcon size={20} /> Write instead
        </Button>
      </div>
    );
  }

  const live = voice.status === "hearing" || voice.status === "listening";
  return (
    <div className="flex w-full items-center justify-between gap-3">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => voice.setMuted(!voice.muted)}
        aria-pressed={voice.muted}
        aria-label={voice.muted ? "Unmute microphone" : "Mute microphone"}
      >
        {voice.muted ? <MicOffIcon /> : <MicIcon />}
      </Button>
      <p className="flex-1 text-center text-sm text-muted" aria-live="polite">
        {voice.muted ? "Microphone is muted" : STATUS_TEXT[voice.status]}
        {live && !voice.muted && (
          <span className="ml-2 inline-block size-2 animate-pulse rounded-full bg-accent align-middle" aria-hidden />
        )}
      </p>
      <Button variant="ghost" size="icon" onClick={onSwitchToText} aria-label="Switch to writing">
        <KeyboardIcon />
      </Button>
    </div>
  );
}
