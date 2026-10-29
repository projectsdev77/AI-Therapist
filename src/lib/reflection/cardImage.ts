import { BRAND } from "@/lib/brand";
import { WEATHER_LABELS } from "@/lib/conversation/types";
import type { Reflection } from "@/lib/data/types";
import { readToken } from "@/lib/design/tokens";
import { SKY_COLORS } from "@/lib/design/skies";

export type CardFormat = "feed" | "story";

export interface CardOptions {
  format: CardFormat;
  /** The person's own words are off by default; one tap adds the first quote. */
  includeQuote: boolean;
}

const SIZES: Record<CardFormat, [number, number]> = { feed: [1080, 1350], story: [1080, 1920] };
const PAD = 96;

// Deep lagoon values (src/styles/tokens.css).
const TEXT = "#effcfa";
const MUTED = "#d3eae9";
const ACCENT = "#a8f5ee";

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

function streak(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, rot: number, color: string) {
  ctx.save();
  ctx.filter = "blur(60px)";
  ctx.fillStyle = color;
  ctx.translate(x, y);
  ctx.rotate(rot);
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** Renders a reflection card to PNG on the Deep lagoon background (README open item 4). */
export async function renderCardImage(reflection: Reflection, opts: CardOptions): Promise<Blob> {
  await document.fonts.ready;
  const geist = readToken("--font-geist") || "system-ui";
  const [W, H] = SIZES[opts.format];
  const story = opts.format === "story";

  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background: the --lg-bg gradient and two soft light streaks.
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0d4643");
  bg.addColorStop(0.3, "#0b3a40");
  bg.addColorStop(0.66, "#0b2a35");
  bg.addColorStop(1, "#081822");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  streak(ctx, W * 0.3, H * 0.28, W * 0.8, 120, -0.28, "rgba(80,230,215,.16)");
  streak(ctx, W * 0.9, H * 0.62, W * 0.7, 120, 0.24, "rgba(30,90,170,.26)");

  // The card: a glass panel with its sky across the top.
  const cardX = PAD - 24;
  const cardW = W - cardX * 2;
  const cardY = story ? 220 : PAD;
  const cardH = H - cardY - (story ? 300 : PAD + 110);
  const skyH = story ? 300 : 240;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 56);
  ctx.clip();
  ctx.fillStyle = "rgba(150,240,230,.10)";
  ctx.fillRect(cardX, cardY, cardW, cardH);
  const [a, b] = SKY_COLORS[reflection.weather];
  const sky = ctx.createLinearGradient(cardX, cardY, cardX + cardW * 0.6, cardY + skyH * 1.6);
  sky.addColorStop(0, a);
  sky.addColorStop(1, b);
  ctx.fillStyle = sky;
  ctx.fillRect(cardX, cardY, cardW, skyH);
  const shade = ctx.createLinearGradient(0, cardY, 0, cardY + skyH);
  shade.addColorStop(0.3, "rgba(8,24,34,0)");
  shade.addColorStop(1, "rgba(8,24,34,.6)");
  ctx.fillStyle = shade;
  ctx.fillRect(cardX, cardY, cardW, skyH);
  ctx.restore();
  ctx.strokeStyle = "rgba(255,255,255,.16)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 56);
  ctx.stroke();

  // Date and sky name on the sky.
  const d = new Date(reflection.createdAt);
  const date = new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long" }).format(d);
  ctx.fillStyle = TEXT;
  ctx.font = `500 32px ${geist}`;
  ctx.textBaseline = "alphabetic";
  ctx.fillText(date, PAD + 12, cardY + skyH - 32);
  ctx.textAlign = "right";
  ctx.fillText(WEATHER_LABELS[reflection.weather], W - PAD - 12, cardY + skyH - 32);
  ctx.textAlign = "left";

  // Title.
  const inner = cardW - 2 * (PAD - cardX + 12);
  const x = PAD + 12;
  let y = cardY + skyH + (story ? 120 : 96);
  const titleSize = story ? 84 : 70;
  ctx.fillStyle = TEXT;
  ctx.font = `600 ${titleSize}px ${geist}`;
  for (const line of wrap(ctx, reflection.title, inner).slice(0, 3)) {
    ctx.fillText(line, x, y);
    y += titleSize * 1.12;
  }

  // One quote, only if the person chose to include it, with the aqua rule.
  if (opts.includeQuote && reflection.quotes[0]) {
    y += story ? 36 : 22;
    const qSize = story ? 52 : 42;
    ctx.font = `400 ${qSize}px ${geist}`;
    const qLines = wrap(ctx, `“${reflection.quotes[0]}”`, inner - 40).slice(0, 4);
    ctx.fillStyle = "rgba(143,240,232,.4)";
    ctx.fillRect(x, y - qSize, 5, qLines.length * qSize * 1.35);
    ctx.fillStyle = TEXT;
    for (const line of qLines) {
      ctx.fillText(line, x + 36, y);
      y += qSize * 1.35;
    }
  }

  // Insight.
  y += story ? 30 : 18;
  ctx.font = `400 ${story ? 40 : 36}px ${geist}`;
  ctx.fillStyle = MUTED;
  for (const line of wrap(ctx, reflection.insight, inner).slice(0, story ? 5 : 3)) {
    ctx.fillText(line, x, y);
    y += story ? 56 : 50;
  }

  // Next step in a glass box at the foot of the card.
  if (reflection.nextStep) {
    ctx.font = `400 ${story ? 42 : 36}px ${geist}`;
    const stepLines = wrap(ctx, reflection.nextStep, inner - 72).slice(0, 2);
    const lineH = story ? 56 : 48;
    const boxH = 64 + 40 + stepLines.length * lineH;
    const boxY = Math.max(y + 20, cardY + cardH - boxH - 48);
    if (boxY + boxH < cardY + cardH - 20) {
      ctx.fillStyle = "rgba(150,240,230,.17)";
      ctx.beginPath();
      ctx.roundRect(x, boxY, inner, boxH, 36);
      ctx.fill();
      ctx.fillStyle = ACCENT;
      ctx.font = `600 30px ${geist}`;
      ctx.fillText("A small next step", x + 36, boxY + 60);
      ctx.fillStyle = TEXT;
      ctx.font = `400 ${story ? 42 : 36}px ${geist}`;
      stepLines.forEach((line, i) => ctx.fillText(line, x + 36, boxY + 60 + 50 + i * lineH));
    }
  }

  // Wordmark: the orb dot and the name.
  const footY = story ? H - 170 : H - PAD + 10;
  const dotR = 22;
  const dot = ctx.createRadialGradient(PAD + dotR, footY - 14 - dotR * 0.16, 0, PAD + dotR, footY - 14, dotR);
  dot.addColorStop(0, "#1a8c84");
  dot.addColorStop(0.62, "#0b3c44");
  dot.addColorStop(1, "#04141a");
  ctx.fillStyle = dot;
  ctx.beginPath();
  ctx.arc(PAD + dotR, footY - 14, dotR, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(111,240,230,.55)";
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = TEXT;
  ctx.font = `600 40px ${geist}`;
  ctx.fillText(BRAND.name, PAD + dotR * 2 + 18, footY);

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
