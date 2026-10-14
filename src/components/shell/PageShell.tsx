import type { ReactNode } from "react";
import type { Weather } from "@/lib/conversation/types";
import { Backdrop } from "./Backdrop";
import { TopBar } from "./TopBar";

/** Standard screen: sky + mesh, top bar with back, and a centered 640px column. */
export function PageShell({
  title,
  subtitle,
  children,
  weather = null,
  back = true,
}: {
  /** Use <span className="accent"> for the one serif accent word. */
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  weather?: Weather | null;
  back?: boolean;
}) {
  return (
    <div className="relative min-h-dvh">
      <Backdrop weather={weather} />
      <TopBar back={back} />
      <main className="relative mx-auto w-full max-w-[640px] px-4 pt-3 pb-8">
        {title && (
          <header className="mb-5 flex flex-col gap-1">
            <h1 className="heading">{title}</h1>
            {subtitle && <p className="text-muted text-pretty">{subtitle}</p>}
          </header>
        )}
        {children}
      </main>
    </div>
  );
}
