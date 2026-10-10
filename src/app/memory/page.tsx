import type { Metadata } from "next";
import { MemoryView } from "@/components/memory/MemoryView";

export const metadata: Metadata = { title: "What I remember" };

export default function MemoryPage() {
  return <MemoryView />;
}
