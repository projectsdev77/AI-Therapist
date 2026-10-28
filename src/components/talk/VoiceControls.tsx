"use client";

import type { ReactNode } from "react";
import { Dock, DockMic, DockSide } from "@/components/shell/Dock";
import { CheckIcon, MicIcon, MicOffIcon, PauseIcon } from "@/components/ui/icons";
import type { Voice } from "@/lib/voice/useVoice";

/** The mic's three looks: idle (mic), listening (level bars + pulsing ring), speaking (pause). */
export function micLook(voice: Voice): "off" | "listening" | "speaking" {
  if (voice.status === "speaking") return "speaking";
  if (!voice.muted && (voice.status === "listening" || voice.status === "hearing")) return "listening";
  return "off";
}

/**
 * Voice mode's dock: Mute · mic · Wrap up. The mic starts talking when idle, pauses (mutes)
 * while listening, and interrupts while the companion speaks.
 */
export function VoiceDock({
  voice,
  started,
  onStart,
  onWrapUp,
}: {
  voice: Voice;
  started: boolean;
  onStart: () => void;
  onWrapUp: () => void;
}) {
  const look = micLook(voice);
  const live = started && voice.status !== "off" && voice.status !== "error" && voice.status !== "unsupported";
  const thinking = voice.status === "thinking" || voice.status === "transcribing";

  let icon: ReactNode = <MicIcon size={28} />;
  let label = "Tap to talk";
  let aria = "Start talking";
  let action = onStart;
  if (live && look === "listening") {
    icon = [0, 0.15, 0.3, 0.45, 0.6].map((d) => (
      <span key={d} className="mic-bar block h-[22px] w-1 rounded-[2px] bg-current" style={{ animationDelay: `${d}s` }} />
    ));
    label = "Listening";
    aria = "Listening. Tap to pause";
    action = () => voice.setMuted(true);
  } else if (live && look === "speaking") {
    icon = <PauseIcon size={26} />;
    label = "Tap to interrupt";
    aria = "Haven is speaking. Tap to interrupt";
    action = voice.interrupt;
  } else if (live && voice.muted) {
    label = "Paused";
    aria = "Paused. Tap to keep talking";
    action = () => voice.setMuted(false);
  } else if (live && thinking) {
    label = "Thinking";
    aria = "Thinking";
    action = () => undefined;
  } else if (live) {
    label = "Listening";
    aria = "Listening";
    action = () => undefined;
  }

  return (
    <Dock
      className="mt-11 w-full"
      left={
        <DockSide label="Mute" ariaLabel="Mute microphone" pressed={voice.muted} disabled={!live} onClick={() => voice.setMuted(!voice.muted)}>
          <MicOffIcon size={22} />
        </DockSide>
      }
      center={
        <DockMic ariaLabel={aria} label={label} onClick={action} live={live && look === "listening"}>
          {icon}
        </DockMic>
      }
      right={
        <DockSide label="Wrap up" ariaLabel="Wrap up this conversation" haspopup onClick={onWrapUp}>
          <CheckIcon size={22} strokeWidth={1.8} />
        </DockSide>
      }
    />
  );
}

/** A 56px tool button: 18px aqua icon over a 13px label (README "Tools row"). */
export function ToolButton({
  label,
  ariaLabel,
  icon,
  onClick,
  haspopup,
  active,
  dot,
  disabled,
}: {
  label: string;
  ariaLabel?: string;
  icon: ReactNode;
  onClick: () => void;
  haspopup?: boolean;
  active?: boolean;
  dot?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-haspopup={haspopup ? "dialog" : undefined}
      disabled={disabled}
      className={`press relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-sm border border-edge-lo px-1 py-1.5 text-[13px] font-medium hover:bg-glass hover:text-text disabled:opacity-45 ${
        active || dot ? "text-text" : "text-muted"
      } ${active ? "bg-glass-strong" : "bg-transparent"}`}
    >
      <span className="text-accent-strong">{icon}</span>
      {label}
      {dot && <span aria-hidden className="absolute top-2 right-[calc(50%-18px)] size-[7px] rounded-full bg-dot" />}
    </button>
  );
}
