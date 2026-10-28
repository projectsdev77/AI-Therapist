import type { ReactNode } from "react";
import { PageHeading } from "@/components/ui/List";
import { Backdrop } from "./Backdrop";
import { TopBar } from "./TopBar";

/** A standard page: lagoon background, top bar (title on phone), and a centred column. */
export function PageShell({
  title,
  subtitle,
  children,
  width = 640,
  heading = true,
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  /** Column max-width in px (640 memory/settings, 680–720 privacy/skies, 760 patterns, 1040 reflection). */
  width?: number;
  /** Show the desktop page title and subtitle above the content. */
  heading?: boolean;
}) {
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
