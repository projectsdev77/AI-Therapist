import type { Metadata } from "next";
import { PatternsView } from "@/components/patterns/PatternsView";

export const metadata: Metadata = { title: "Your patterns" };

export default function PatternsPage() {
  return <PatternsView />;
}
