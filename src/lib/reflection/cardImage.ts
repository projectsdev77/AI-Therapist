import { drawSky, type SkyWeather } from "@/components/sky/skyRenderer";
import { BRAND } from "@/lib/brand";
import { WEATHER_LABELS, type Tone } from "@/lib/conversation/types";
import type { Reflection } from "@/lib/data/types";
import { readToken, toneToken } from "@/lib/design/tokens";

export type CardFormat = "feed" | "story";

export interface CardOptions {
  format: CardFormat;
  /** The person's own words are off by default; one tap adds the first quote. */
  includeQuote: boolean;
  tone?: Tone;
}

const SIZES: Record<CardFormat, [number, number]> = { feed: [1080, 1350], story: [1080, 1920] };
const PAD = 96;

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function rgba(hex: string, a: number) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/./g, "$&$&") : h, 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}

/** One still frame of the orb: membranes and lit core, from tokens. */
function drawOrb(ctx: CanvasRenderingContext2D, cx: number, cy: number, R: number, tone: string, core: string, membrane: string, dark: boolean) {
  const glow = ctx.createRadialGradient(cx, cy, R * 0.4, cx, cy, R * 1.9);
  glow.addColorStop(0, rgba(tone, dark ? 0.1 : 0.4));
  glow.addColorStop(1, rgba(tone, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(cx - R * 2, cy - R * 2, R * 4, R * 4);
  ctx.globalCompositeOperation = dark ? "screen" : "source-over";
  for (const [k, c, a] of [
    [1.22, membrane, 0.22],
    [1.08, tone, 0.38],
    [0.94, tone, 0.55],
  ] as const) {
    ctx.fillStyle = rgba(c, a);
    ctx.beginPath();
    ctx.ellipse(cx, cy, R * k, R * k * 0.97, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalCompositeOperation = "source-over";
  const g = ctx.createRadialGradient(cx - R * 0.12, cy - R * 0.15, 0, cx, cy, R * 0.85);
  g.addColorStop(0, rgba(core, 0.95));
  g.addColorStop(0.35, rgba(core, 0.55));
  g.addColorStop(1, rgba(tone, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, R * 0.85, 0, Math.PI * 2);
  ctx.fill();
}

/** Renders a reflection card to PNG, drawn from the live design tokens and current theme. */
export async function renderCardImage(reflection: Reflection, opts: CardOptions): Promise<Blob> {
  await document.fonts.ready;
  const root = document.documentElement;
  const geist = readToken("--font-geist") || "system-ui";
  const serif = readToken("--font-instrument") || "Georgia";
  const dark = getComputedStyle(root).colorScheme !== "light";
  const [W, H] = SIZES[opts.format];
  const story = opts.format === "story";

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const bg = readToken("--color-bg");
  const text = readToken("--color-text");
  const muted = readToken("--color-text-muted");
  const accentStrong = readToken("--color-accent-strong");
  const band = readToken("--color-band");

  // Page.
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Sky (and orb on Stories) across the top, fading into the page.
  const skyH = Math.round(H * (story ? 0.4 : 0.32));
  const w = reflection.weather as SkyWeather;
  drawSky(
    ctx,
    W,
    skyH,
    { top: readToken(`--sky-${w}-top`), bottom: readToken(`--sky-${w}-bottom`), glow: readToken("--sky-glow"), dark },
    { weather: w, t: 0, full: false },
  );
  const fade = ctx.createLinearGradient(0, skyH * 0.6, 0, skyH);
  fade.addColorStop(0, rgba(bg, 0));
  fade.addColorStop(1, rgba(bg, 1));
  ctx.fillStyle = fade;
  ctx.fillRect(0, skyH * 0.6, W, skyH * 0.4 + 1);

  if (story) {
    drawOrb(
      ctx,
      W / 2,
      skyH * 0.55,
      W * 0.17,
      readToken(toneToken(opts.tone ?? "neutral")),
      readToken("--orb-core"),
      readToken("--orb-membrane"),
      dark,
    );
  }

  // Date line (inside the Stories safe area).
  const d = new Date(reflection.createdAt);
  const date = new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long" }).format(d);
  ctx.fillStyle = text;
  ctx.font = `500 32px ${geist}`;
  ctx.textBaseline = "alphabetic";
  const dateY = story ? 250 : PAD + 24;
  ctx.fillText(date, PAD, dateY);
  ctx.textAlign = "right";
  ctx.fillStyle = muted;
  ctx.font = `400 32px ${geist}`;
  ctx.fillText(WEATHER_LABELS[reflection.weather], W - PAD, dateY);
  ctx.textAlign = "left";

  // Title.
  let y = skyH + (story ? 120 : 90);
  const titleSize = story ? 92 : 76;
  ctx.fillStyle = text;
  ctx.font = `300 ${titleSize}px ${geist}`;
  for (const line of wrap(ctx, reflection.title, W - PAD * 2).slice(0, 3)) {
    ctx.fillText(line, PAD, y);
    y += titleSize * 1.12;
  }

  // One quote, only if the person chose to include it.
  if (opts.includeQuote && reflection.quotes[0]) {
    y += story ? 40 : 24;
    const qSize = story ? 70 : 52;
    ctx.font = `italic 400 ${qSize}px ${serif}`;
    ctx.fillStyle = text;
    for (const line of wrap(ctx, `“${reflection.quotes[0]}”`, W - PAD * 2).slice(0, 4)) {
      ctx.fillText(line, PAD, y);
      y += qSize * 1.25;
    }
  }

  // Insight on the feed card.
  if (!story) {
    y += 20;
    ctx.font = `400 38px ${geist}`;
    ctx.fillStyle = muted;
    for (const line of wrap(ctx, reflection.insight, W - PAD * 2).slice(0, 4)) {
      ctx.fillText(line, PAD, y);
      y += 54;
    }
  }

  // Next step on a band.
  const footerY = story ? H - 250 : H - PAD;
  if (reflection.nextStep) {
    ctx.font = `400 ${story ? 44 : 38}px ${geist}`;
    const stepLines = wrap(ctx, reflection.nextStep, W - PAD * 2 - 72).slice(0, 2);
    const lineH = story ? 58 : 50;
    const boxH = 72 + 40 + stepLines.length * lineH;
    const boxY = Math.min(Math.max(y + 30, skyH), footerY - boxH - 70);
    ctx.fillStyle = band;
    ctx.beginPath();
    ctx.roundRect(PAD, boxY, W - PAD * 2, boxH, 32);
    ctx.fill();
    ctx.fillStyle = accentStrong;
    ctx.font = `500 30px ${geist}`;
    ctx.fillText("A small next step", PAD + 36, boxY + 64);
    ctx.fillStyle = text;
    ctx.font = `400 ${story ? 44 : 38}px ${geist}`;
    stepLines.forEach((line, i) => ctx.fillText(line, PAD + 36, boxY + 64 + 52 + i * lineH));
  }

  // Wordmark.
  ctx.fillStyle = muted;
  ctx.font = `italic 400 52px ${serif}`;
  ctx.fillText(BRAND.name.toLowerCase(), PAD, footerY);

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not render image"))), "image/png"));
}

/** Shares the image when the device supports it, otherwise downloads it. */
export async function saveCardImage(blob: Blob, title: string): Promise<void> {
  const name = `${title.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").toLowerCase() || "reflection"}.png`;
  const file = new File([blob], name, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return;
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
