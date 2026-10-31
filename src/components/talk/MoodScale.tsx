"use client";

/**
 * A one-tap 0–10 mood rating (like a therapist's quick mood check). The person's own number
 * shapes the conversation's sky and shows real change over time.
 */
export function MoodScale({ label, value, onChange, compact = false }: { label: string; value: number | null; onChange: (v: number) => void; compact?: boolean }) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      <div role="radiogroup" aria-label={label} className="grid grid-cols-11 gap-1">
        {Array.from({ length: 11 }, (_, n) => {
          const on = value === n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={`${n} out of 10`}
              onClick={() => onChange(n)}
              className={`press flex items-center justify-center rounded-full text-[14px] font-medium tabular-nums ${compact ? "h-10" : "h-11"} ${
                on ? "bg-mic font-semibold text-mic-fg" : "border border-edge-lo bg-glass text-text hover:bg-glass-strong"
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div aria-hidden className="flex justify-between px-1 text-[12px] text-faint">
        <span>Very low</span>
        <span>Very good</span>
      </div>
    </div>
  );
}
