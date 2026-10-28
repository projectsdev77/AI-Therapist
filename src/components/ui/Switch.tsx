"use client";

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  className?: string;
}

/**
 * A 44×26 track in a 52×44 hit area (README "Switch"). On: aqua track, dark knob.
 * Off: clear track with a faint border, muted knob.
 */
export function Switch({ checked, onChange, label, disabled = false, className = "" }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`inline-flex h-11 w-[52px] shrink-0 items-center justify-center ${className}`}
    >
      <span
        aria-hidden
        className={`relative block h-[26px] w-11 rounded-[13px] border transition-colors duration-[var(--lg-fast)] ease-lg ${
          checked ? "border-transparent bg-mic" : "border-faint bg-transparent"
        }`}
      >
        <span
          className={`absolute top-[2px] block size-5 rounded-full transition-[left,background-color] duration-[var(--lg-fast)] ease-lg ${
            checked ? "left-[20px] bg-mic-fg" : "left-[2px] bg-muted"
          }`}
        />
      </span>
    </button>
  );
}
