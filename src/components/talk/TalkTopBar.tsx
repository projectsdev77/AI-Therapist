"use client";

import { useShell } from "@/components/shell/AppShell";
import { HelpIcon, PanelIcon } from "@/components/ui/icons";

/**
 * The conversation's top row inside the desktop shell: the status in the middle. Once the sidebar
 * has slid away, Show menu sits on the left and Get help on the right, so help stays one tap away.
 */
export function TalkTopBar({ status }: { status: string }) {
  const shell = useShell();
  const hidden = shell?.sidebarHidden ?? false;
  return (
    <header className="relative z-[2] grid shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2.5 px-6 pt-5">
      <div className="justify-self-start">
        {hidden && (
          <button
            type="button"
            onClick={shell?.toggleSidebar}
            aria-label="Show menu"
            title="Show menu"
            className="press panel-in flex size-11 items-center justify-center rounded-sm border border-edge-hi bg-glass text-text hover:bg-glass-strong"
          >
            <PanelIcon size={20} />
          </button>
        )}
      </div>
      <span role="status" className="flex min-h-9 items-center gap-2 rounded-pill bg-glass px-3.5 text-[13px] font-medium whitespace-nowrap text-muted">
        <span aria-hidden className="size-[7px] rounded-full bg-dot" />
        {status}
      </span>
      <div className="justify-self-end">
        {hidden && (
          <button
            type="button"
            onClick={shell?.openHelp}
            aria-haspopup="dialog"
            className="press panel-in flex min-h-11 items-center gap-1.5 rounded-pill bg-care-surface px-3.5 text-[14px] font-semibold whitespace-nowrap text-care hover:bg-[rgba(220,207,255,.18)]"
          >
            <HelpIcon size={15} />
            Get help
          </button>
        )}
      </div>
    </header>
  );
}
