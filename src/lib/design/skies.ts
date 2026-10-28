import type { Weather } from "@/lib/conversation/types";

/** Sky colours (README "Sky colours"): each sky is linear-gradient(160deg, A, B). */
export const SKY_COLORS: Record<Weather, [string, string]> = {
  clear: ["#8ff0e8", "#3fd6cd"],
  haze: ["#b3d4d3", "#5f8f91"],
  drizzle: ["#6f9bff", "#2a6fd0"],
  storm: ["#5b5fb8", "#232a66"],
  breaking: ["#b8a8ff", "#6ff0e6"],
  quiet: ["#2a5560", "#0f2a33"],
};

export function skyGradient(weather: Weather): string {
  const [a, b] = SKY_COLORS[weather];
  return `linear-gradient(160deg, ${a}, ${b})`;
}

/** The 30-day sky line: a horizontal gradient of each day's B colour, one stop per day. Empty days use quiet. */
export function skyLine(days: (Weather | null)[]): string {
  if (days.length === 0) return SKY_COLORS.quiet[1];
  const stops = days.map((w, i) => `${SKY_COLORS[w ?? "quiet"][1]} ${(((i + 0.5) / days.length) * 100).toFixed(1)}%`);
  return `linear-gradient(90deg, ${stops.join(", ")})`;
}

/** Why the app picked a sky (the sky picker says it, so the person can disagree with the reason). */
export const SKY_REASONS: Record<Weather, string> = {
  clear: "it felt calm or warm most of the way",
  haze: "it felt a little unsettled",
  drizzle: "it felt heavy for much of it",
  storm: "it felt heavy or frustrated for much of it",
  breaking: "it started heavy and ended lighter",
  quiet: "it was a quiet one",
};
