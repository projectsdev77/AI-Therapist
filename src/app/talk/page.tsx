"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { TalkScreen } from "@/components/talk/TalkScreen";

function TalkWithMode() {
  const mode = useSearchParams().get("mode") === "text" ? "text" : "voice";
  return <TalkScreen initialMode={mode} />;
}

export default function TalkPage() {
  return (
    <Suspense>
      <TalkWithMode />
    </Suspense>
  );
}
