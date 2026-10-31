import type { Metadata } from "next";
import { PrepareView } from "@/components/prepare/PrepareView";

export const metadata: Metadata = { title: "My first appointment" };

export default function PreparePage() {
  return <PrepareView />;
}
