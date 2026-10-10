import type { Metadata } from "next";
import { LabClient } from "./LabClient";

export const metadata: Metadata = {
  title: "Visual lab",
  robots: { index: false },
};

export default function LabPage() {
  return <LabClient />;
}
