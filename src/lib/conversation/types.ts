/** Emotional tone of the conversation. Drives the Presence tint. */
export const TONES = [
  "neutral",
  "calm",
  "heavy",
  "anxious",
  "warm",
  "hopeful",
  "frustrated",
] as const;
export type Tone = (typeof TONES)[number];

/** Safety classification of a user turn. See docs/SPEC.md §8. */
export const RISK_LEVELS = ["none", "low", "elevated", "acute"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

/** Inner Weather: one per session, derived from tone and its arc. */
export const WEATHERS = ["clear", "haze", "drizzle", "storm", "breaking"] as const;
export type Weather = (typeof WEATHERS)[number];

/** Visual state of the Presence orb. */
export type PresenceState = "idle" | "listening" | "thinking" | "speaking" | "concerned";

export function isTone(value: unknown): value is Tone {
  return typeof value === "string" && (TONES as readonly string[]).includes(value);
}

export function isRiskLevel(value: unknown): value is RiskLevel {
  return typeof value === "string" && (RISK_LEVELS as readonly string[]).includes(value);
}

export function isWeather(value: unknown): value is Weather {
  return typeof value === "string" && (WEATHERS as readonly string[]).includes(value);
}

export const WEATHER_LABELS: Record<Weather, string> = {
  clear: "Clear",
  haze: "Haze",
  drizzle: "Drizzle",
  storm: "Storm",
  breaking: "Rain, then clearing",
};
