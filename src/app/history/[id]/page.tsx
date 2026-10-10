import { Suspense } from "react";
import { SessionDetail } from "@/components/reflection/SessionDetail";

export default function SessionPage() {
  return (
    <Suspense>
      <SessionDetail />
    </Suspense>
  );
}
