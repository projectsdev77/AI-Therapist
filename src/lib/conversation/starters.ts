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
  { id: "off", label: "I've been feeling off lately", message: "I've been feeling off lately." },
  { id: "stuck", label: "I can't stop thinking about something", message: "I can't stop thinking about something." },
  { id: "unsure", label: "I don't know what I'm feeling", message: "I don't know what I'm feeling.", supportStyle: "understand" },
  { id: "listen", label: "I just want someone to listen", message: "I just want someone to listen.", supportStyle: "listen" },
];

export function starterById(id: string): Starter | undefined {
  return STARTERS.find((s) => s.id === id);
}
