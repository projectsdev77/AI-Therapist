"use client";

import type { CaptionLine } from "@/components/captions/Captions";
import { Sheet } from "@/components/ui/Sheet";

export function TranscriptSheet({ open, onClose, lines }: { open: boolean; onClose: () => void; lines: CaptionLine[] }) {
  return (
    <Sheet open={open} onClose={onClose} label="Conversation transcript">
      <h2 className="font-display text-2xl">This conversation</h2>
      {lines.length === 0 ? (
        <p className="mt-4 text-muted">Nothing yet.</p>
      ) : (
        <ol className="mt-5 flex flex-col gap-4">
          {lines.map((l) => (
            <li key={l.id}>
              <p className="text-xs uppercase tracking-widest text-faint">{l.speaker === "user" ? "You" : "Companion"}</p>
              <p className={l.speaker === "user" ? "mt-1 text-muted" : "mt-1 font-display text-lg"}>{l.text}</p>
            </li>
          ))}
        </ol>
      )}
    </Sheet>
  );
}
