import { BRAND } from "@/lib/brand";
import { WEATHER_LABELS } from "@/lib/conversation/types";
import type { Reflection } from "@/lib/data/types";
import { readToken } from "@/lib/design/tokens";

const W = 1080;
const H = 1350;
const PAD = 96;

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
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

/** Renders a reflection card to a portrait PNG for saving or sharing. Uses the live design tokens. */
export async function renderCardImage(reflection: Reflection): Promise<Blob> {
  await document.fonts.ready;
  const display = readToken("--font-instrument") || "Georgia";
  const body = readToken("--font-geist") || "system-ui";
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background: the card's sky fading into the page color.
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, readToken(`--sky-${reflection.weather}-top`));
  sky.addColorStop(0.32, readToken(`--sky-${reflection.weather}-bottom`));
  sky.addColorStop(0.5, readToken("--color-bg"));
  sky.addColorStop(1, readToken("--color-bg"));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  const text = readToken("--color-text");
  const muted = readToken("--color-text-muted");
  const accent = readToken("--color-accent");
  let y = PAD + 20;

  ctx.fillStyle = text;
  ctx.font = `500 30px ${body}`;
  const date = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(new Date(reflection.createdAt));
  ctx.fillText(date.toUpperCase(), PAD, y);
  ctx.textAlign = "right";
  ctx.fillText(WEATHER_LABELS[reflection.weather], W - PAD, y);
  ctx.textAlign = "left";

  y = 470;
  ctx.font = `500 76px ${display}`;
  for (const line of wrap(ctx, reflection.title, W - PAD * 2).slice(0, 3)) {
    ctx.fillText(line, PAD, y);
    y += 88;
  }

  y += 20;
  ctx.font = `italic 40px ${display}`;
  for (const quote of reflection.quotes.slice(0, 2)) {
    const lines = wrap(ctx, `“${quote}”`, W - PAD * 2 - 36).slice(0, 3);
    ctx.fillStyle = accent;
    ctx.fillRect(PAD, y - 34, 4, lines.length * 54 - 10);
    ctx.fillStyle = muted;
    for (const line of lines) {
      ctx.fillText(line, PAD + 36, y);
      y += 54;
    }
    y += 24;
  }

  ctx.fillStyle = text;
  ctx.font = `400 38px ${body}`;
  for (const line of wrap(ctx, reflection.insight, W - PAD * 2).slice(0, 5)) {
    ctx.fillText(line, PAD, y);
    y += 56;
  }

  if (reflection.nextStep && y < H - 260) {
    y += 30;
    ctx.fillStyle = muted;
    ctx.font = `500 26px ${body}`;
    ctx.fillText("A SMALL NEXT STEP", PAD, y);
    y += 50;
    ctx.fillStyle = text;
    ctx.font = `400 38px ${body}`;
    for (const line of wrap(ctx, reflection.nextStep, W - PAD * 2).slice(0, 2)) {
      ctx.fillText(line, PAD, y);
      y += 54;
    }
  }

  ctx.fillStyle = muted;
  ctx.font = `500 34px ${display}`;
  ctx.fillText(BRAND.name, PAD, H - PAD + 10);

  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not render image"))), "image/png"));
}

/** Shares the image when the device supports it, otherwise downloads it. */
export async function saveCardImage(reflection: Reflection): Promise<void> {
  const blob = await renderCardImage(reflection);
  const file = new File([blob], `${reflection.title.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").toLowerCase() || "reflection"}.png`, { type: "image/png" });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: reflection.title });
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
