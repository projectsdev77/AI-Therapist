/**
 * Crisis resources by region. Verify every number before launch and on a schedule
 * (docs/SPEC.md §8). Keep copy calm and direct.
 */
export interface CrisisLine {
  name: string;
  /** Short name for the compact in-conversation panel, e.g. "988 Lifeline". */
  shortName?: string;
  description: string;
  /** tel: target, digits only (plus optional leading +). */
  call?: string;
  /** How the number is written locally, e.g. "116 123". Defaults to `call`. */
  callDisplay?: string;
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
      { name: "988 Suicide & Crisis Lifeline", shortName: "988 Lifeline", description: "Call or text, 24/7. Free and confidential.", call: "988", text: { to: "988" }, display: "Call or text 988" },
      { name: "Crisis Text Line", description: "Text with a trained volunteer.", text: { to: "741741", body: "HOME" }, display: "Text HOME to 741741" },
    ],
  },
  {
    code: "CA",
    name: "Canada",
    emergency: "911",
    lines: [
      { name: "9-8-8 Suicide Crisis Helpline", shortName: "9-8-8", description: "Call or text, 24/7.", call: "988", callDisplay: "9-8-8", text: { to: "988" }, display: "Call or text 9-8-8" },
    ],
  },
  {
    code: "GB",
    name: "United Kingdom",
    emergency: "999",
    lines: [
      { name: "Samaritans", description: "Call any time, day or night, free.", call: "116123", callDisplay: "116 123", display: "Call 116 123" },
      { name: "Shout", description: "Free, confidential text support.", text: { to: "85258", body: "SHOUT" }, display: "Text SHOUT to 85258" },
    ],
  },
  {
    code: "IE",
    name: "Ireland",
    emergency: "112",
    lines: [
      { name: "Samaritans", description: "Call any time, free.", call: "116123", callDisplay: "116 123", display: "Call 116 123" },
      { name: "Text About It", description: "Free text support, 24/7.", text: { to: "50808", body: "HELLO" }, display: "Text HELLO to 50808" },
    ],
  },
  {
    code: "AU",
    name: "Australia",
    emergency: "000",
    lines: [{ name: "Lifeline", description: "Crisis support, 24/7.", call: "131114", callDisplay: "13 11 14", display: "Call 13 11 14" }],
  },
  {
    code: "NZ",
    name: "New Zealand",
    emergency: "111",
    lines: [{ name: "1737, Need to talk?", shortName: "1737", description: "Call or text a trained counsellor, 24/7.", call: "1737", text: { to: "1737" }, display: "Call or text 1737" }],
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

export function callLabel(line: CrisisLine): string {
  return `Call ${line.callDisplay ?? line.call}`;
}

export function textLabel(line: CrisisLine): string {
  if (!line.text) return "";
  return line.text.body ? `Text ${line.text.body} to ${line.text.to}` : `Text ${line.text.to}`;
}

/** The region's lines plus an "Emergency services" entry when the number is known. */
export function linesWithEmergency(res: RegionResources): CrisisLine[] {
  if (!/^\d+$/.test(res.emergency)) return res.lines;
  return [
    ...res.lines,
    {
      name: "Emergency services",
      description: "If you or someone else is in immediate danger.",
      call: res.emergency,
      display: `Call ${res.emergency}`,
    },
  ];
}
