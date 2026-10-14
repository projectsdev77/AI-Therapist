"use client";

import type { CaptionLine } from "@/components/captions/Captions";
import { Sheet } from "@/components/ui/Sheet";

export function TranscriptSheet({ open, onClose, lines }: { open: boolean; onClose: () => void; lines: CaptionLine[] }) {
  return (
    <Sheet open={open} onClose={onClose} label="Conversation transcript">
      <h2 className="heading heading-sheet">
        This <span className="accent">conversation</span>
      </h2>
      {lines.length === 0 ? (
        <p className="mt-4 text-muted">Nothing yet.</p>
      ) : (
        <ol className="mt-5 flex flex-col gap-4">
          {lines.map((l) => (
            <li key={l.id}>
              <p className="text-sm font-medium text-muted">{l.speaker === "user" ? "You" : "Companion"}</p>
              <p className={l.speaker === "user" ? "voice-person mt-0.5 text-[19px]" : "voice-companion mt-0.5 text-[19px]"}>{l.text}</p>
            </li>
          ))}
        </ol>
      )}
    </Sheet>
  );
}
