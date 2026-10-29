"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { Backdrop } from "@/components/shell/Backdrop";
import { TopBar } from "@/components/shell/TopBar";
import { HOME } from "@/lib/routes";
import { useShortcuts } from "@/lib/shortcuts";
import { useIsWide } from "@/lib/useIsDesktop";
import { BreatheMode } from "./BreatheMode";

/** Breathe on its own (Home "Slow down", the landing page). I'm done goes back to where you came from. */
export function BreathePage() {
  const router = useRouter();
  const wide = useIsWide();
  const done = () => (window.history.length > 1 ? router.back() : router.push(HOME));
  useShortcuts({ Escape: done }, wide);

  if (wide) {
    return (
      <AppShell scroll={false}>
        <BreatheMode onDone={done} />
      </AppShell>
    );
  }
  return (
    <div className="relative flex h-dvh flex-col">
      <Backdrop />
      <TopBar title="Breathe" />
      <main className="relative z-[1] flex min-h-0 flex-1 flex-col">
        <BreatheMode onDone={done} />
      </main>
    </div>
  );
}
