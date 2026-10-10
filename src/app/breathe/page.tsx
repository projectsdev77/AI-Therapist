import type { Metadata } from "next";
import { BreatheMode } from "@/components/breathe/BreatheMode";
import { TopBar } from "@/components/shell/TopBar";

export const metadata: Metadata = { title: "Breathe" };

export default function BreathePage() {
  return (
    <div className="min-h-dvh">
      <TopBar transparent />
      <main className="mx-auto max-w-xl px-4 py-6">
        <BreatheMode />
      </main>
    </div>
  );
}
