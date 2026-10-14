"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
  /** Prevents closing with Escape or the scrim (e.g. consent). */
  dismissible?: boolean;
  /** "bottom": bottom sheet on mobile, centered panel on desktop. "side": bottom sheet on mobile, right panel on desktop. */
  placement?: "bottom" | "side";
}

const CLOSE_MS = 420;
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Sheets sit below the top bar (z-40 vs the bar's z-50), so Get help is never covered.
 * Rise 24px and fade in over --motion-sheet with --ease-settle; close over 420ms.
 */
export function Sheet({ open, onClose, label, children, dismissible = true, placement = "bottom" }: SheetProps) {
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Mount on open; play the close animation before unmounting.
  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- mirrors the open prop for the exit animation
      setMounted(true);
      setClosing(false);
      return;
    }
    if (!mounted) return;
    setClosing(true);
    const id = setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, CLOSE_MS);
    return () => clearTimeout(id);
  }, [open, mounted]);

  // Focus in, trap Tab, Escape to close, restore focus, lock scroll.
  useEffect(() => {
    if (!open || !mounted) return;
    returnFocus.current = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panel)?.focus({ preventScroll: true });
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && dismissible) {
        e.preventDefault();
        onCloseRef.current();
      }
      if (e.key === "Tab" && panel) {
        const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)];
        if (!items.length) return;
        const firstEl = items[0];
        const lastEl = items[items.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      returnFocus.current?.focus?.({ preventScroll: true });
    };
  }, [open, mounted, dismissible]);

  if (!mounted || typeof document === "undefined") return null;

  const side = placement === "side";
  return createPortal(
    <div className="fixed inset-0 z-40" data-state={closing ? "closing" : "open"}>
      <div
        aria-hidden
        onClick={() => dismissible && onClose()}
        className="sheet-scrim absolute inset-0 bg-[rgba(10,12,8,0.45)]"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        tabIndex={-1}
        className={[
          "sheet-panel absolute inset-x-0 bottom-0 flex max-h-[calc(100dvh-100px)] flex-col overflow-y-auto",
          "rounded-t-lg bg-bg px-5 pt-2.5 pb-[max(30px,env(safe-area-inset-bottom))] text-text shadow-raised outline-none",
          side
            ? "sm:inset-x-auto sm:top-[92px] sm:right-[clamp(16px,3vw,40px)] sm:bottom-auto sm:w-[396px] sm:rounded-lg sm:pb-5"
            : "sm:inset-x-0 sm:top-1/2 sm:bottom-auto sm:mx-auto sm:w-[min(560px,calc(100vw-32px))] sm:-translate-y-1/2 sm:rounded-lg sm:pb-7",
        ].join(" ")}
      >
        <span aria-hidden className="mb-4 h-1 w-10 shrink-0 self-center rounded-full bg-border sm:hidden" />
        {children}
      </div>
    </div>,
    document.body,
  );
}
