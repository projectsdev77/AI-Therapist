import type { Metadata } from "next";
import { BreathePage } from "@/components/breathe/BreathePage";

export const metadata: Metadata = { title: "Breathe" };

export default function Page() {
  return <BreathePage />;
}
