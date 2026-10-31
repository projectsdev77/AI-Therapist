"use client";

import { useState } from "react";
import type { Heard } from "@/lib/data/types";
import { MoodScale } from "./MoodScale";
import type { CaptionLine } from "@/components/captions/Captions";
import { Button } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { SUPPORT_STYLE_OPTIONS, type SupportStyle } from "@/lib/conversation/types";

/** "What would help right now?": four radio rows; picking one closes the sheet. */
export function StyleSheet({
  open,
  onClose,
  value,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  value: SupportStyle | null;
  onChange: (style: SupportStyle | null) => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="What would help right now?" subtitle="I'll lean this way until you change it.">
      <div role="radiogroup" aria-label="What would help right now?" className="flex flex-col gap-1">
        {SUPPORT_STYLE_OPTIONS.map((o) => {
          const on = o.id === value;
          return (
            <button
              key={o.id ?? "auto"}
              type="button"
              role="radio"
              aria-checked={on}
              data-autofocus={on || undefined}
              onClick={() => {
                onChange(o.id);
                onClose();
              }}
              className={`press flex min-h-16 items-center gap-3.5 rounded-md border px-3.5 py-2.5 text-left text-text hover:bg-glass ${
                on ? "border-edge-hi bg-glass-strong" : "border-transparent bg-transparent"
              }`}
            >
              <span className="flex flex-1 flex-col">
                <span className={`text-[17px] ${on ? "font-semibold" : ""}`}>{o.label}</span>
                <span className="text-sm text-muted">{o.desc}</span>
              </span>
              <span
                aria-hidden
                className={`box-border size-[22px] shrink-0 rounded-full ${on ? "border-[6px] border-mic bg-mic-fg" : "border-[1.5px] border-faint"}`}
              />
            </button>
          );
        })}
      </div>
      <p className="m-0 text-sm text-muted">
        This lasts for this conversation. You can also just say it, like &ldquo;can you just listen for a bit?&rdquo;
      </p>
    </Sheet>
  );
}

const timeFmt = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
const dayFmt = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" });

/** "Today", "Yesterday", or the date, relative to when the conversation's last line was said. */
function dayLabel(at: number) {
  const d = new Date(at);
  const now = new Date();
  const days = Math.round((new Date(now.toDateString()).getTime() - new Date(d.toDateString()).getTime()) / 86400000);
  return days === 0 ? "Today" : days === 1 ? "Yesterday" : dayFmt.format(d);
}

/** The full conversation, each turn labelled and timed. Copy and Back to talking stay pinned. */
export function TranscriptSheet({ open, onClose, lines, startedAt }: { open: boolean; onClose: () => void; lines: CaptionLine[]; startedAt?: string }) {
  const visible = lines.filter((l) => l.text.trim());
  const first = startedAt ? Date.parse(startedAt) : visible[0]?.at;
  const latest = visible.at(-1)?.at ?? first;
  const minutes = first && latest ? Math.max(1, Math.round((latest - first) / 60000)) : 0;
  const day = first ? dayLabel(first) : "Today";

  async function copy() {
    const text = visible.map((l) => `${l.speaker === "user" ? "You" : "Haven"}: ${l.text}`).join("\n\n");
    await navigator.clipboard?.writeText(text).catch(() => undefined);
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Transcript"
      subtitle={`${day} · ${minutes} minute${minutes === 1 ? "" : "s"} · only you can see this`}
      wide
    >
      <ol aria-label="Conversation transcript" className="m-0 flex list-none flex-col gap-3.5 p-0">
        {visible.length === 0 && <li className="text-muted">Nothing yet.</li>}
        {visible.map((l) => {
          const haven = l.speaker === "companion";
          return (
            <li key={l.id} className={`flex flex-col gap-0.5 border-l-2 pl-3 ${haven ? "border-[rgba(143,240,232,.45)]" : "border-edge-lo"}`}>
              <span className={`text-[13px] font-semibold ${haven ? "text-accent-strong" : "text-faint"}`}>
                {haven ? "Haven" : "You"}
                {l.at ? ` · ${timeFmt.format(l.at)}` : ""}
              </span>
              <span className={`text-base ${haven ? "text-text" : "text-muted"}`}>{l.text}</span>
            </li>
          );
        })}
      </ol>
      <div className="sticky -bottom-7 flex flex-wrap gap-2 bg-sheet pt-3 pb-1">
        <Button variant="secondary" size="lg" onClick={() => void copy()}>
          Copy text
        </Button>
        <Button variant="primary" size="lg" onClick={onClose}>
          Back to talking
        </Button>
      </div>
    </Sheet>
  );
}

/**
 * Wrap up (the design's "End"): make the card now, or leave it open and pick it up later.
 * An alertdialog; Keep talking closes it.
 */
export function WrapUpSheet({
  open,
  onClose,
  onWrapUp,
  onLater,
  busy,
}: {
  open: boolean;
  onClose: () => void;
  /** With the person's optional end-of-conversation ratings. */
  onWrapUp: (feedback: { mood: number | null; heard: Heard | null }) => void;
  onLater: () => void;
  busy?: boolean;
}) {
  const [mood, setMood] = useState<number | null>(null);
  const [heard, setHeard] = useState<Heard | null>(null);
  return (
    <Sheet
      open={open}
      onClose={onClose}
      role="alertdialog"
      closeButton={false}
      title="Wrap up and make your card?"
      subtitle="I'll turn this into a reflection card. You can edit or delete it after."
    >
      <div className="flex flex-col gap-1.5">
        <p className="m-0 text-[15px] font-medium">How are you feeling now? (optional)</p>
        <MoodScale label="How are you feeling now?" value={mood} onChange={setMood} compact />
      </div>
      <div className="flex flex-col gap-1.5">
        <p id="heard-label" className="m-0 text-[15px] font-medium">
          Did you feel heard today? (optional)
        </p>
        <div role="radiogroup" aria-labelledby="heard-label" className="grid grid-cols-3 gap-1.5">
          {(
            [
              ["yes", "Yes"],
              ["somewhat", "Somewhat"],
              ["no", "Not really"],
            ] as const
          ).map(([value, text]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={heard === value}
              onClick={() => setHeard(value)}
              className={`press min-h-11 rounded-pill text-[14px] ${
                heard === value ? "bg-mic font-semibold text-mic-fg" : "border border-edge-lo bg-glass text-text hover:bg-glass-strong"
              }`}
            >
              {text}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Button variant="primary" size="xl" onClick={() => onWrapUp({ mood, heard })} disabled={busy} className="w-full">
          {busy ? "Wrapping up…" : "Wrap up and make my card"}
        </Button>
        <Button variant="secondary" onClick={onLater} disabled={busy} className="min-h-[52px] w-full text-base">
          I&apos;ll be back
        </Button>
        <Button variant="tertiary" onClick={onClose} className="w-full">
          Keep talking
        </Button>
      </div>
    </Sheet>
  );
}
