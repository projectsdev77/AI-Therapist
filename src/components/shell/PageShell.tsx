"use client";

import type { ReactNode } from "react";
import { PageHeading } from "@/components/ui/List";
import { useIsWide } from "@/lib/useIsDesktop";
import { AppShell } from "./AppShell";
import { Backdrop } from "./Backdrop";
import { TopBar } from "./TopBar";

/**
 * A standard page. Phone and tablet: lagoon background, top bar (title on phone), and a
 * centred column. 1024px and up: the desktop app shell, with an optional side panel.
 */
export function PageShell({
  title,
  subtitle,
  children,
  width = 640,
  heading = true,
  panel,
  panelLabel,
  desktopWidth = 720,
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  /** Column max-width in px (640 memory/settings, 680–720 privacy/skies, 760 patterns, 1040 reflection). */
  width?: number;
  /** Show the desktop page title and subtitle above the content. */
  heading?: boolean;
  /** Desktop side panel (1024px and up). */
  panel?: ReactNode;
  panelLabel?: string;
  /** Column max-width inside the desktop shell. */
  desktopWidth?: number;
}) {
  const wide = useIsWide();

  if (wide) {
    return (
      <AppShell panel={panel} panelLabel={panelLabel}>
        <div className="px-10 pt-8 pb-10">
          <div className="mx-auto flex flex-col gap-6" style={{ maxWidth: desktopWidth }}>
            {heading && (
              <div className="flex flex-col gap-1.5">
                <h1 className="m-0 text-[40px] leading-[1.1] font-semibold tracking-[-0.04em]">{title}</h1>
                {subtitle && <p className="m-0 text-base text-muted">{subtitle}</p>}
              </div>
            )}
            {children}
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <div className="relative flex min-h-dvh flex-col">
      <Backdrop />
      <TopBar title={title} />
      <main className="relative w-full flex-1 px-5 pt-4 pb-12">
        <div className="mx-auto flex flex-col gap-[22px]" style={{ maxWidth: width }}>
          {heading && <PageHeading title={title} subtitle={subtitle} />}
          {children}
        </div>
      </main>
    </div>
  );
}
