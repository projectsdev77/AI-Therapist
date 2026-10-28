import type { ReactNode } from "react";

export interface CaptionLine {
  id: string;
  speaker: "user" | "companion";
  text: string;
  /** True while the line is still streaming in. */
  pending?: boolean;
  /** When the line was said (ms since epoch), for the transcript. */
  at?: number;
}

export interface CaptionView {
  /** The line before the latest exchange: faint, blurred, two lines at most. */
  prev: CaptionLine | null;
  /** The person's latest words. */
  person: CaptionLine | null;
  /** The companion's latest words. */
  companion: CaptionLine | null;
}

/** Which lines are on screen: the latest exchange plus one line of context before it. */
export function pickCaptions(lines: CaptionLine[]): CaptionView {
  const visible = lines.filter((l) => l.text.trim().length > 0);
  const last = visible.at(-1) ?? null;
  if (!last) return { prev: null, person: null, companion: null };
  if (last.speaker === "user") return { prev: visible.at(-2) ?? null, person: last, companion: null };
  const before = visible.at(-2) ?? null;
  if (before?.speaker === "user") return { prev: visible.at(-3) ?? null, person: before, companion: last };
  return { prev: before, person: null, companion: last };
}

export interface CaptionsProps {
  view: CaptionView;
  /** Waiting for the first words of a reply: show the companion's dot alone. */
  waiting?: boolean;
  /** Extra rows under the captions (acknowledgement, slow reply, errors, support pill). */
  children?: ReactNode;
}

/** Captions, not bubbles (README "Talking & writing"). Left-aligned on phone, centred on desktop. */
export function Captions({ view, waiting = false, children }: CaptionsProps) {
  const { prev, person, companion } = view;
  const streaming = companion?.pending;
  return (
    <>
      {prev && (
        <p aria-hidden className="m-0 line-clamp-2 text-[clamp(15px,1.3vw,17px)] opacity-[.28] blur-[1px]">
          {prev.text}
        </p>
      )}
      <div aria-live="polite" className="flex flex-col items-start gap-3 min-[720px]:items-center">
        {person && (
          <p key={person.id} className="caption-line m-0 text-[clamp(17px,1.4vw,19px)] text-muted">
            {person.text}
          </p>
        )}
        {companion && (
          <p key={companion.id} className="caption-line m-0 text-[clamp(23px,2.4vw,30px)] leading-[1.3] font-medium tracking-[-0.02em]">
            {companion.text}
            {streaming && <span aria-hidden className="pulse-dot ml-2 inline-block size-2 rounded-full bg-dot align-middle" />}
          </p>
        )}
        {waiting && !companion && (
          <p role="status" aria-label="Thinking" className="m-0 flex h-[39px] items-center">
            <span aria-hidden className="pulse-dot inline-block size-2 rounded-full bg-dot" />
          </p>
        )}
        {children}
      </div>
    </>
  );
}
