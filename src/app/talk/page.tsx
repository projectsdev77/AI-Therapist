"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { TalkScreen } from "@/components/talk/TalkScreen";

function TalkWithMode() {
  const params = useSearchParams();
  const resume = params.get("resume") ?? undefined;
  const topic = params.get("topic")?.slice(0, 40) || undefined;
  // Picking up defaults to writing (it starts at once); voice still needs a tap.
  const mode = params.get("mode") === "voice" ? "voice" : params.get("mode") === "text" || resume ? "text" : "voice";
  return <TalkScreen key={resume ?? topic ?? mode} initialMode={mode} resumeId={resume} topic={topic} />;
}

export default function TalkPage() {
  return (
    <Suspense>
      <TalkWithMode />
    </Suspense>
  );
}
