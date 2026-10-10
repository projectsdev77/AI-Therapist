import type { Tone } from "@/lib/conversation/types";

export type RGB = [number, number, number];

/** Reads a CSS custom property from :root (client only). */
export function readToken(name: string, el: Element = document.documentElement): string {
  return getComputedStyle(el).getPropertyValue(name).trim();
}

/** Parses #rgb, #rrggbb, or rgb()/rgba() into 0..1 floats. Falls back to mid-grey. */
export function parseColor(value: string): RGB {
  const v = value.trim();
  const hex = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split("").map((c) => c + c).join("");
    const n = parseInt(h, 16);
    return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
  }
  const rgb = v.match(/^rgba?\(([^)]+)\)$/i);
  if (rgb) {
    const [r, g, b] = rgb[1].split(/[\s,/]+/).map(Number);
    if ([r, g, b].every((x) => Number.isFinite(x))) return [r / 255, g / 255, b / 255];
  }
  return [0.6, 0.6, 0.7];
}

export function toneToken(tone: Tone | "concerned"): string {
  return `--tone-${tone}`;
}

export function readMs(name: string, fallback: number): number {
  const raw = readToken(name);
  const n = parseFloat(raw);
  if (!Number.isFinite(n)) return fallback;
  return raw.endsWith("ms") ? n : raw.endsWith("s") ? n * 1000 : n;
}

export function mixRGB(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}
