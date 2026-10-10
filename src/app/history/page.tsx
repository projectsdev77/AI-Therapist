import type { Metadata } from "next";
import { HistoryView } from "@/components/history/HistoryView";

export const metadata: Metadata = { title: "Your skies" };

export default function HistoryPage() {
  return <HistoryView />;
}
