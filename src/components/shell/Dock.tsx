import type { ReactNode } from "react";

/**
 * The dock (README "Dock"): a 32px-radius glass panel, max 420px, three columns. The centre
 * holds the 76px aqua mic, raised 60px above the dock inside a ringed 116px holder.
 */
export function Dock({ left, center, right, className = "" }: { left: ReactNode; center: ReactNode; right: ReactNode; className?: string }) {
  return (
    <div
      className={`relative grid w-[min(420px,calc(100%-32px))] grid-cols-[1fr_auto_1fr] items-center self-center rounded-lg border border-edge-hi bg-glass px-[18px] pt-4 pb-3.5 backdrop-blur-[18px] ${className}`}
    >
      <div className="flex flex-col items-center gap-1.5 justify-self-start">{left}</div>
      <div className="flex flex-col items-center gap-1.5">{center}</div>
      <div className="flex flex-col items-center gap-1.5 justify-self-end">{right}</div>
    </div>
  );
}

/** A 52px glass side button with its 12px label underneath. */
export function DockSide({
  label,
  ariaLabel,
  onClick,
  disabled,
  pressed,
  haspopup,
  children,
}: {
  label: string;
  ariaLabel: string;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
  haspopup?: boolean;
  children: ReactNode;
}) {
  return (
    <>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-pressed={pressed}
        aria-haspopup={haspopup ? "dialog" : undefined}
        onClick={onClick}
        disabled={disabled}
        className="press inline-flex size-[52px] items-center justify-center rounded-md border border-edge-hi bg-glass-strong text-text hover:bg-glass-hover active:scale-[0.96] disabled:opacity-45"
      >
        {children}
      </button>
      <span aria-hidden className={`text-[12px] font-medium text-muted ${disabled ? "opacity-45" : ""}`}>
        {label}
      </span>
    </>
  );
}

/** The raised mic: a 76px aqua circle in a 116px holder with one ring (and a pulse while live). */
export function DockMic({
  ariaLabel,
  label,
  onClick,
  live = false,
  children,
}: {
  ariaLabel: string;
  label: string;
  onClick: () => void;
  live?: boolean;
  children: ReactNode;
}) {
  return (
    <>
      <div className="relative -mt-[60px] flex size-[116px] items-center justify-center">
        {live && <span aria-hidden className="mic-pulse absolute inset-3 rounded-full border border-mic-ring" />}
        <span aria-hidden className="absolute inset-3 rounded-full border border-mic-ring" />
        <button
          type="button"
          aria-label={ariaLabel}
          onClick={onClick}
          className="press relative inline-flex size-[76px] items-center justify-center gap-1 rounded-full bg-mic text-mic-fg shadow-[0_8px_22px_var(--lg-mic-shadow)] hover:bg-mic-hover active:scale-[0.96]"
        >
          {children}
        </button>
      </div>
      <span aria-hidden className="text-[15px] font-semibold whitespace-nowrap">
        {label}
      </span>
    </>
  );
}
