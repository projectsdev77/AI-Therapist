import type { SupportStyle } from "./types";

/**
 * Optional ways to begin, for when finding the first words is hard. Choosing one sends
 * its message as the person's first words; some also set the kind of support they want.
 */
export interface Starter {
  id: string;
  label: string;
  /** Sent as the person's message. */
  message: string;
  supportStyle?: SupportStyle;
}

export const STARTERS: Starter[] = [
  { id: "happened", label: "Something happened today", message: "Something happened today." },
  { id: "off", label: "I've been feeling off", message: "I've been feeling off." },
  { id: "stuck", label: "I can't stop thinking about something", message: "I can't stop thinking about something." },
  { id: "vent", label: "I just need to vent", message: "I just need to vent.", supportStyle: "listen" },
];

export function starterById(id: string): Starter | undefined {
  return STARTERS.find((s) => s.id === id);
}
