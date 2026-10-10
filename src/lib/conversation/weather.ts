import type { Tone, Weather } from "./types";

/** Live sky during a conversation: a gentle read of the current tone. */
export function toneToWeather(tone: Tone): Weather | null {
  switch (tone) {
    case "calm":
    case "warm":
      return "clear";
    case "anxious":
      return "haze";
    case "heavy":
      return "drizzle";
    case "frustrated":
      return "storm";
    case "hopeful":
      return "breaking";
    default:
      return null;
  }
}

const HEAVINESS: Record<Tone, number> = {
  frustrated: 3,
  heavy: 3,
  anxious: 2,
  neutral: 1,
  calm: 0,
  warm: 0,
  hopeful: 0,
};

/**
 * A session's weather from its tones, oldest first. The arc matters: a hard start
 * that ends lighter is "breaking"; a steady heavy session is "drizzle" or "storm".
 */
export function sessionWeather(tones: Tone[]): Weather {
  if (tones.length === 0) return "clear";
  const avg = tones.reduce((s, t) => s + HEAVINESS[t], 0) / tones.length;
  const half = Math.max(1, Math.floor(tones.length / 2));
  const early = tones.slice(0, half).reduce((s, t) => s + HEAVINESS[t], 0) / half;
  const lateTones = tones.slice(-half);
  const late = lateTones.reduce((s, t) => s + HEAVINESS[t], 0) / lateTones.length;
  const frustrated = tones.filter((t) => t === "frustrated").length / tones.length;

  if (tones.length >= 2 && early >= 1.5 && late <= early - 1) return "breaking";
  if (avg >= 2.4 || frustrated >= 0.5) return "storm";
  if (avg >= 1.8) return "drizzle";
  if (avg >= 1.0) return "haze";
  return "clear";
}
