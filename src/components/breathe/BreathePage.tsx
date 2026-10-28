"use client";

import { useRouter } from "next/navigation";
import { Backdrop } from "@/components/shell/Backdrop";
import { TopBar } from "@/components/shell/TopBar";
import { HOME } from "@/lib/routes";
import { BreatheMode } from "./BreatheMode";

/** Breathe on its own (Home "Slow down", the landing page). I'm done goes back to where you came from. */
export function BreathePage() {
  const router = useRouter();
  return (
    <div className="relative flex h-dvh flex-col">
      <Backdrop />
      <TopBar title="Breathe" />
      <main className="relative z-[1] flex min-h-0 flex-1 flex-col">
        <BreatheMode onDone={() => (window.history.length > 1 ? router.back() : router.push(HOME))} />
      </main>
    </div>
  );
}
