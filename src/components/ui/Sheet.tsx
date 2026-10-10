"use client";

import { useEffect, useRef, type ReactNode } from "react";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
  /** Prevents closing with Escape or backdrop click (e.g. consent). */
  dismissible?: boolean;
  tone?: "default" | "care";
}

/** Bottom sheet on mobile, centered panel on desktop. Built on <dialog> for focus handling. */
export function Sheet({ open, onClose, label, children, dismissible = true, tone = "default" }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onCancel={(e) => {
        e.preventDefault();
        if (dismissible) onClose();
      }}
      onClick={(e) => {
        if (dismissible && e.target === e.currentTarget) onClose();
      }}
      className={[
        "m-0 mt-auto w-full max-w-none rounded-t-lg border border-border p-0 text-text shadow-2xl",
        "sm:m-auto sm:w-[min(34rem,calc(100vw-2rem))] sm:rounded-lg",
        "backdrop:bg-black/50 backdrop:backdrop-blur-sm",
        tone === "care" ? "bg-bg" : "bg-bg",
      ].join(" ")}
    >
      <div className="max-h-[88dvh] overflow-y-auto px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5 sm:px-7 sm:pb-7">
        {children}
      </div>
    </dialog>
  );
}
