export interface CaptionLine {
  id: string;
  speaker: "user" | "companion";
  text: string;
  /** True while the line is still streaming in. */
  pending?: boolean;
}

export interface CaptionsProps {
  lines: CaptionLine[];
  /** Waiting for the first words of a reply. */
  thinking?: boolean;
  className?: string;
}

function lineClass(speaker: CaptionLine["speaker"], age: number) {
  const voice =
    speaker === "user"
      ? "voice-person text-[20px] leading-[1.35]"
      : "voice-companion text-[23px] leading-[1.38]";
  // Age 0 is full text; age 1 is muted but full opacity (AA); age 2 is decorative.
  const color = age === 0 ? "text-text" : "text-muted";
  return `${voice} ${color}`;
}

/**
 * Captions, not bubbles. The companion speaks in a light grotesque; the person's words
 * are set in serif italic. The previous line stays muted; the one before dissolves.
 */
export function Captions({ lines, thinking = false, className = "" }: CaptionsProps) {
  const visible = lines.filter((l) => l.text.trim().length > 0).slice(-3);
  const older = visible.length === 3 ? visible[0] : null;
  const live = visible.slice(older ? 1 : 0);

  return (
    <div className={`mx-auto flex w-full max-w-[600px] flex-col gap-3.5 px-7 ${className}`}>
      {older && (
        <p
          key={older.id}
          aria-hidden
          className="caption-leaving m-0 line-clamp-2 text-[17px] font-light opacity-[0.22] blur-[1.2px] -translate-y-1.5"
        >
          {older.text}
        </p>
      )}
      <div aria-live="polite" className="flex flex-col gap-3.5">
        {live.map((line, i) => {
          const age = live.length - 1 - i;
          return (
            <p key={line.id} className={`caption-line m-0 text-pretty ${lineClass(line.speaker, age)}`} data-age={age}>
              {line.text}
              {line.pending && line.speaker === "companion" && (
                <span aria-hidden className="pulse-dot ml-2 inline-block size-[7px] rounded-full bg-accent-strong align-middle" />
              )}
            </p>
          );
        })}
        {thinking && (
          <p role="status" className="m-0 flex h-8 items-center gap-1.5" aria-label="Thinking">
            {[0, 250, 500].map((d) => (
              <span key={d} aria-hidden className="pulse-dot size-[7px] rounded-full bg-accent-strong" style={{ animationDelay: `${d}ms` }} />
            ))}
          </p>
        )}
      </div>
    </div>
  );
}
