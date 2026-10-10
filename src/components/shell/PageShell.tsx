import type { ReactNode } from "react";
import { TopBar } from "./TopBar";

export function PageShell({ title, subtitle, children, wide = false }: { title: string; subtitle?: ReactNode; children: ReactNode; wide?: boolean }) {
  return (
    <div className="min-h-dvh">
      <TopBar />
      <main className={`mx-auto px-4 py-8 sm:py-12 ${wide ? "max-w-5xl" : "max-w-2xl"}`}>
        <h1 className="font-display text-3xl sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}
