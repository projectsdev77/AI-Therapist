/**
 * Ambient sound sources.
 *
 * To use your own recordings: put the files in public/audio/ and set the paths below,
 * e.g. rain: "/audio/ambient-rain.ogg". Leave a value null to use the built-in generated
 * sound. WAV, OGG/Opus, or M4A loop best; the engine trims silence at the ends and
 * crossfades the loop point, so MP3 padding won't cause an audible gap.
 */
export const AMBIENT_FILES: Record<AmbientKind, string | null> = {
  rain: null,
  room: null,
  hum: null,
};

export type AmbientKind = "rain" | "room" | "hum";

export const AMBIENT_LABELS: Record<AmbientKind, string> = {
  rain: "Soft rain",
  room: "Room tone",
  hum: "Low hum",
};
