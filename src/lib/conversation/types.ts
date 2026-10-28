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

/**
 * The kind of support the person asked for: to be heard, to understand what's going on,
 * or to work out what to do. null = let the conversation show it.
 */
export const SUPPORT_STYLES = ["listen", "understand", "act"] as const;
export type SupportStyle = (typeof SUPPORT_STYLES)[number];

export const SUPPORT_STYLE_LABELS: Record<SupportStyle, string> = {
  listen: "Just listen",
  understand: "Help me make sense of it",
  act: "Help me find a next step",
};

/** The style sheet's choices (null = "Whatever feels right"), with their one-line descriptions and acknowledgements. */
export const SUPPORT_STYLE_OPTIONS: { id: SupportStyle | null; label: string; desc: string; ack: string }[] = [
  { id: null, label: "Whatever feels right", desc: "I'll follow your lead", ack: "Okay. I'll follow your lead." },
  { id: "listen", label: "Just listen", desc: "Room to get it all out", ack: "Okay. I'll just listen." },
  { id: "understand", label: "Help me make sense of it", desc: "We'll untangle what's going on", ack: "Okay. Let's make sense of it together." },
  { id: "act", label: "Help me find a next step", desc: "Something small you can do", ack: "Okay. Let's look for one small next step." },
];

/** Inner Weather: one per session, derived from tone and its arc. */
/** "quiet" is never computed; the person can choose it in the sky picker. */
export const WEATHERS = ["clear", "haze", "drizzle", "storm", "breaking", "quiet"] as const;
export type Weather = (typeof WEATHERS)[number];

/** Visual state of the Presence orb. */
export type PresenceState = "idle" | "listening" | "thinking" | "speaking" | "breathing" | "concerned";

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
  quiet: "Quiet",
};
