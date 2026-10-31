import type { Metadata } from "next";
import { ExercisesView } from "@/components/exercises/ExercisesView";

export const metadata: Metadata = { title: "Exercises" };

export default function ExercisesPage() {
  return <ExercisesView />;
}
