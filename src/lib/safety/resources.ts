/**
 * Crisis resources by region. Verify every number before launch and on a schedule
 * (docs/SPEC.md §8). Keep copy calm and direct.
 */
export interface CrisisLine {
  name: string;
  description: string;
  /** tel: target, digits only (plus optional leading +). */
  call?: string;
  /** sms: target and optional prefilled body. */
  text?: { to: string; body?: string };
  url?: string;
  display: string;
}

export interface RegionResources {
  code: string;
  name: string;
  emergency: string;
  lines: CrisisLine[];
}

export const REGIONS: RegionResources[] = [
  {
    code: "US",
    name: "United States",
    emergency: "911",
    lines: [
      { name: "988 Suicide & Crisis Lifeline", description: "Call or text, 24/7, free and confidential.", call: "988", text: { to: "988" }, display: "Call or text 988" },
      { name: "Crisis Text Line", description: "Text with a trained crisis counselor.", text: { to: "741741", body: "HOME" }, display: "Text HOME to 741741" },
    ],
  },
  {
    code: "CA",
    name: "Canada",
    emergency: "911",
    lines: [
      { name: "9-8-8 Suicide Crisis Helpline", description: "Call or text, 24/7.", call: "988", text: { to: "988" }, display: "Call or text 9-8-8" },
    ],
  },
  {
    code: "GB",
    name: "United Kingdom",
    emergency: "999",
    lines: [
      { name: "Samaritans", description: "Call any time, day or night, free.", call: "116123", display: "Call 116 123" },
      { name: "Shout", description: "Free, confidential text support.", text: { to: "85258", body: "SHOUT" }, display: "Text SHOUT to 85258" },
    ],
  },
  {
    code: "IE",
    name: "Ireland",
    emergency: "112",
    lines: [
      { name: "Samaritans", description: "Call any time, free.", call: "116123", display: "Call 116 123" },
      { name: "Text About It", description: "Free text support, 24/7.", text: { to: "50808", body: "HELLO" }, display: "Text HELLO to 50808" },
    ],
  },
  {
    code: "AU",
    name: "Australia",
    emergency: "000",
    lines: [{ name: "Lifeline", description: "Crisis support, 24/7.", call: "131114", display: "Call 13 11 14" }],
  },
  {
    code: "NZ",
    name: "New Zealand",
    emergency: "111",
    lines: [{ name: "1737, Need to talk?", description: "Call or text a trained counsellor, 24/7.", call: "1737", text: { to: "1737" }, display: "Call or text 1737" }],
  },
];

export const INTERNATIONAL: RegionResources = {
  code: "INTL",
  name: "Somewhere else",
  emergency: "your local emergency number",
  lines: [
    {
      name: "Find a Helpline",
      description: "Free, confidential helplines in over 130 countries.",
      url: "https://findahelpline.com",
      display: "findahelpline.com",
    },
  ],
};

export function resourcesFor(code: string | null | undefined): RegionResources {
  return REGIONS.find((r) => r.code === code?.toUpperCase()) ?? INTERNATIONAL;
}

/** Best guess from the browser locale, e.g. "en-GB" → "GB". */
export function guessRegion(): string | null {
  if (typeof navigator === "undefined") return null;
  for (const lang of navigator.languages ?? [navigator.language]) {
    const part = lang.split("-")[1];
    if (part && part.length === 2) return part.toUpperCase();
  }
  return null;
}

export function smsHref(text: NonNullable<CrisisLine["text"]>): string {
  return `sms:${text.to}${text.body ? `?&body=${encodeURIComponent(text.body)}` : ""}`;
}
