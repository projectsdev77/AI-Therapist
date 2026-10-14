import type { Weather } from "./types";

/** "Today feels like …" */
export const WEATHER_PHRASES: Record<Weather, string> = {
  clear: "a clear sky",
  haze: "a little haze",
  drizzle: "light drizzle",
  storm: "a storm",
  breaking: "the sun breaking through",
};
