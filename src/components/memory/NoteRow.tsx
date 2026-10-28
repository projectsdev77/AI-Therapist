"use client";

import type { ReactNode } from "react";

const quiet = "press min-h-11 rounded-pill bg-transparent px-2.5 text-[14px] text-muted hover:bg-glass hover:text-text";

/** A remembered note with Forget (and optionally Edit). Forgetting swaps it for "Forgotten." with Undo. */
export function NoteRow({
  text,
  gone,
  onForget,
  onUndo,
  onEdit,
}: {
  text: ReactNode;
  gone: boolean;
  onForget: () => void;
  onUndo: () => void;
  onEdit?: () => void;
}) {
  if (gone) {
    return (
      <div role="status" className="flex min-h-[52px] items-center gap-2 rounded-sm border border-dashed border-edge-hi py-1 pr-1 pl-4">
        <span className="flex-1 text-[15px] text-muted">Forgotten.</span>
        <button type="button" onClick={onUndo} className="press min-h-11 rounded-pill bg-glass-strong px-3.5 text-[14px] font-semibold text-text">
          Undo
        </button>
      </div>
    );
  }
  const label = typeof text === "string" ? text : "this note";
  return (
    <div className="flex min-h-[52px] items-center gap-1 rounded-sm border border-edge-lo bg-glass py-1 pr-1 pl-4">
      <span className="flex-1 text-[15px]">{text}</span>
      {onEdit && (
        <button type="button" onClick={onEdit} aria-label={`Edit: ${label}`} className={quiet}>
          Edit
        </button>
      )}
      <button type="button" onClick={onForget} aria-label={`Forget: ${label}`} className={quiet}>
        Forget
      </button>
    </div>
  );
}
