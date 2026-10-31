import type { Metadata } from "next";
import { SafetyPlanView } from "@/components/safety/SafetyPlanView";

export const metadata: Metadata = { title: "My safety plan" };

export default function SafetyPlanPage() {
  return <SafetyPlanView />;
}
