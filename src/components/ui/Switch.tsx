"use client";

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  /** Visually hide the label (it stays the accessible name). */
  hideLabel?: boolean;
  className?: string;
}

/** Designed switch: button role="switch" with a 52×44 hit area. */
export function Switch({ checked, onChange, label, hideLabel = true, className = "" }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={hideLabel ? label : undefined}
      onClick={() => onChange(!checked)}
      className={`inline-flex min-h-11 min-w-[52px] shrink-0 items-center justify-center gap-3 ${className}`}
    >
      <span
        aria-hidden
        className={`relative block h-[26px] w-11 rounded-[13px] border transition-colors duration-[var(--motion-fast)] ease-calm ${
          checked ? "border-transparent bg-accent" : "border-border bg-surface-strong"
        }`}
      >
        <span
          className={`absolute top-[2px] block size-5 rounded-full transition-[left,background-color] duration-[var(--motion-fast)] ease-calm ${
            checked ? "left-[20px] bg-on-accent" : "left-[2px] bg-muted"
          }`}
        />
      </span>
      {!hideLabel && <span className="text-[15px] text-muted">{label}</span>}
    </button>
  );
}
