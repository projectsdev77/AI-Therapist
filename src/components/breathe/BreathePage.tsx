"use client";

import { useRouter } from "next/navigation";
import { Backdrop } from "@/components/shell/Backdrop";
import { TopBar } from "@/components/shell/TopBar";
import { BreatheMode } from "./BreatheMode";

export function BreathePage() {
  const router = useRouter();
  return (
    <div className="relative flex h-dvh flex-col">
      <Backdrop weather="clear" />
      <TopBar back />
      <main className="relative mx-auto flex min-h-0 w-full max-w-[600px] flex-1 flex-col px-4 pb-8">
        <BreatheMode onDone={() => (window.history.length > 1 ? router.back() : router.push("/"))} />
      </main>
    </div>
  );
}
