"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CloseIcon } from "@/components/ui/icons";
import { useIsDesktop } from "@/lib/useIsDesktop";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  /** The sheet title (24/600). Also its accessible name. */
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  /** Show the 44px round Close button. */
  closeButton?: boolean;
  /** alertdialog for End and Delete confirmations. */
  role?: "dialog" | "alertdialog";
  /** Prevents closing with Escape or the scrim. */
  dismissible?: boolean;
  /** "side": the menu, a right panel on desktop. Otherwise a centred dialog on desktop. */
  placement?: "center" | "side";
  /** Wider desktop dialog (Transcript). */
  wide?: boolean;
  /** Lilac title (Get help). */
  care?: boolean;
}

const CLOSE_MS = 320;
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * One shell for every sheet and dialog (README "Sheet / dialog shell"). Phone: a bottom sheet
 * with a grabber. Desktop: a centred dialog, or a right side panel for the menu. Focus is
 * trapped, Esc closes, and focus returns to the trigger.
 */
export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  closeButton = true,
  role = "dialog",
  dismissible = true,
  placement = "center",
  wide = false,
  care = false,
}: SheetProps) {
  const desktop = useIsDesktop();
  const [mounted, setMounted] = useState(open);
  const [closing, setClosing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const titleId = useId();
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
    const first = panel?.querySelector<HTMLElement>(`[data-autofocus], ${FOCUSABLE}`);
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

  const mode = !desktop ? "bottom" : placement === "side" ? "side" : "center";
  const layout = {
    bottom: "items-end justify-center pt-6",
    center: "items-center justify-center p-10",
    side: "items-stretch justify-end p-3",
  }[mode];
  const panel = {
    bottom: "w-full max-h-full rounded-t-lg px-5 pt-2.5 pb-[max(34px,env(safe-area-inset-bottom))]",
    center: `w-full max-h-full rounded-lg px-6 pt-6 pb-7 ${wide ? "max-w-[640px]" : "max-w-[520px]"}`,
    side: "w-full max-w-[380px] rounded-lg px-6 pt-6 pb-7",
  }[mode];

  return createPortal(
    <div className="fixed inset-0 z-[60]" data-state={closing ? "closing" : "open"}>
      <div aria-hidden onClick={() => dismissible && onClose()} className="sheet-scrim absolute inset-0 bg-scrim" />
      <div className={`pointer-events-none absolute inset-0 flex ${layout}`}>
        <div
          ref={panelRef}
          role={role}
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          data-placement={mode}
          className={`sheet-panel pointer-events-auto relative flex flex-col gap-4 overflow-y-auto border border-edge-hi bg-sheet text-text shadow-raised outline-none ${panel}`}
        >
          {mode === "bottom" && <span aria-hidden className="-mb-1 h-1 w-10 shrink-0 self-center rounded-[2px] bg-edge-hi" />}
          <div className="flex items-start gap-3">
            <div className="flex flex-1 flex-col gap-1 pt-1">
              <h2 id={titleId} className={`t-sheet m-0 ${care ? "text-care" : "text-text"}`}>
                {title}
              </h2>
              {subtitle && <p className="m-0 text-[15px] text-muted">{subtitle}</p>}
            </div>
            {closeButton && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="press inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-edge-lo bg-glass text-text hover:bg-glass-strong"
              >
                <CloseIcon size={18} />
              </button>
            )}
          </div>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  );
}
