/**
 * Inner Weather renderer (direction 3a). Port of the designer's reference
 * (docs/design-handoff/from-designer/Sky.dc.html): a gradient from
 * --sky-*-top to --sky-*-bottom plus per-weather atmosphere, drawn on canvas 2D.
 */
export type SkyWeather = "clear" | "haze" | "drizzle" | "storm" | "breaking" | "unknown";

export interface SkyPalette {
  top: string;
  bottom: string;
  glow: string;
  dark: boolean;
}

export interface SkyFrame {
  weather: SkyWeather;
  /** Seconds since start (0 for a still frame). */
  t: number;
  /** Full-screen sky (rain fades behind captions) vs a small tile. */
  full: boolean;
  /** Offsets particle positions so tiles don't all look identical. */
  seed?: number;
}

function rand(i: number) {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function glow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, c0: string, w: number, h: number) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(r, 1));
  g.addColorStop(0, c0);
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

function soft(ctx: CanvasRenderingContext2D, x: number, y: number, rx: number, ry: number, rgb: string, a: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, ry / rx);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, `rgba(${rgb},${a})`);
  g.addColorStop(0.5, `rgba(${rgb},${a * 0.5})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  ctx.fillStyle = g;
  ctx.fillRect(-rx, -rx, rx * 2, rx * 2);
  ctx.restore();
}

function cloud(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, rgb: string, a: number) {
  for (let k = 0; k < 4; k++) {
    const cx = x + (k - 1.5) * r * 0.55;
    const cy = y + Math.sin(k * 1.7) * r * 0.12;
    const rr = r * (0.55 + 0.18 * Math.cos(k * 2.1));
    soft(ctx, cx, cy, rr, rr * 0.5, rgb, a);
  }
}

function rays(ctx: CanvasRenderingContext2D, x: number, y: number, len: number, n: number, spread: number, rgb: string, a: number) {
  ctx.save();
  ctx.translate(x, y);
  for (let i = 0; i < n; i++) {
    const ang = -Math.PI / 2 + (i - (n - 1) / 2) * spread;
    const g = ctx.createLinearGradient(0, 0, Math.cos(ang) * len, Math.sin(ang) * len);
    g.addColorStop(0, `rgba(${rgb},${a})`);
    g.addColorStop(1, `rgba(${rgb},0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(ang - 0.05) * len, Math.sin(ang - 0.05) * len);
    ctx.lineTo(Math.cos(ang + 0.05) * len, Math.sin(ang + 0.05) * len);
    ctx.fill();
  }
  ctx.restore();
}

/** Draws one frame of a weather into a w×h (CSS pixel) area. */
export function drawSky(ctx: CanvasRenderingContext2D, w: number, h: number, palette: SkyPalette, frame: SkyFrame) {
  const { weather: W, t, full } = frame;
  const seed = (frame.seed ?? 0) * 101;
  const r = (i: number) => rand(i + seed);
  const { dark } = palette;

  let g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, palette.top);
  g.addColorStop(1, palette.bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  const s = Math.min(w, h);
  const L = Math.max(w, h);

  if (dark) {
    if (W === "clear" || W === "unknown") {
      glow(ctx, w * 0.75, h * 0.12, s * 0.7, palette.glow, w, h);
      const n = W === "clear" ? 46 : 18;
      for (let i = 0; i < n; i++) {
        const x = r(i) * w;
        const y = r(i + 99) * h * 0.6;
        const tw = 0.5 + 0.5 * Math.sin(t * 0.6 + i * 1.7);
        ctx.fillStyle = `rgba(244,246,232,${0.25 + 0.45 * tw})`;
        ctx.beginPath();
        ctx.arc(x, y, (0.6 + r(i + 7) * 1.1) * (s > 200 ? 1 : 0.7), 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (W === "haze") {
      for (let i = 0; i < 5; i++) {
        const x = (((r(i) * 1.4 - 0.2) * w + t * (6 + i * 2)) % (w * 1.4)) - w * 0.2;
        glow(ctx, x, h * (0.15 + i * 0.16), s * 0.55, "rgba(220,215,190,.05)", w, h);
      }
    } else if (W === "breaking") {
      const rise = 0.5 + 0.5 * Math.sin(t * 0.15);
      // Capped at .06 / .025 so captions keep AA contrast.
      glow(ctx, w * 0.5, h * (1.02 - rise * 0.06), L * 0.8, "rgba(240,190,120,.06)", w, h);
      rays(ctx, w * 0.5, h * 1.02, h * 1.1, 7, 0.22, "240,200,140", 0.025);
    }
  } else {
    if (W === "clear") {
      const sx = w * 0.8;
      const sy = h * 0.2;
      glow(ctx, w * 0.1, 0, L * 0.7, "rgba(196,222,232,.6)", w, h);
      glow(ctx, sx, sy, L * 0.8, "rgba(255,236,196,.85)", w, h);
      glow(ctx, sx, sy, s * 0.22, "rgba(255,250,232,.95)", w, h);
      ctx.fillStyle = "rgba(255,253,244,.95)";
      ctx.beginPath();
      ctx.arc(sx, sy, Math.max(6, s * 0.055), 0, Math.PI * 2);
      ctx.fill();
      ctx.lineCap = "round";
      for (let i = 0; i < 3; i++) {
        const y = h * (0.12 + i * 0.13);
        const x0 = ((t * (4 + i) + r(i + 20) * w) % (w * 1.6)) - w * 0.6;
        const gg = ctx.createLinearGradient(x0, 0, x0 + w * 0.7, 0);
        gg.addColorStop(0, "rgba(255,255,255,0)");
        gg.addColorStop(0.5, "rgba(255,255,255,.5)");
        gg.addColorStop(1, "rgba(255,255,255,0)");
        ctx.strokeStyle = gg;
        ctx.lineWidth = Math.max(3, s * 0.02);
        ctx.filter = `blur(${Math.max(1.5, s * 0.008)}px)`;
        ctx.beginPath();
        ctx.moveTo(x0, y);
        ctx.quadraticCurveTo(x0 + w * 0.35, y - s * 0.03, x0 + w * 0.7, y + s * 0.01);
        ctx.stroke();
      }
      ctx.filter = "none";
    } else if (W === "unknown") {
      glow(ctx, w * 0.22, h * 0.3, L * 0.6, "rgba(255,252,240,.8)", w, h);
      glow(ctx, w * 0.9, h * 0.05, L * 0.5, "rgba(214,226,232,.55)", w, h);
      ctx.fillStyle = "rgba(255,255,252,.75)";
      ctx.beginPath();
      ctx.arc(w * 0.22, h * 0.3, Math.max(5, s * 0.045), 0, Math.PI * 2);
      ctx.fill();
      for (let i = 0; i < 2; i++) {
        const y = h * (0.5 + i * 0.16);
        const off = (t * (3 + i * 2)) % w;
        for (let k = -1; k < 2; k++) soft(ctx, off + k * w, y, w * 0.7, s * 0.12, "255,255,255", 0.55);
      }
    } else if (W === "haze") {
      for (let i = 0; i < 5; i++) {
        const x = (((r(i) * 1.4 - 0.2) * w + t * (6 + i * 2)) % (w * 1.4)) - w * 0.2;
        glow(ctx, x, h * (0.15 + i * 0.16), s * 0.55, "rgba(255,252,240,.55)", w, h);
      }
    } else if (W === "breaking") {
      const rise = 0.5 + 0.5 * Math.sin(t * 0.15);
      const hx = w * 0.5;
      const hy = h;
      glow(ctx, hx, hy, L * 0.85, "rgba(255,206,150,.55)", w, h);
      rays(ctx, hx, hy, h * 0.95, 7, 0.21, "255,250,236", 0.28);
      glow(ctx, hx, hy - s * 0.02 * rise, s * 0.35, "rgba(255,246,225,.95)", w, h);
      const drift = t * 3;
      ([[0.12, 0.1, 0.32], [0.62, 0.06, 0.38], [0.92, 0.2, 0.26], [0.35, 0.24, 0.22]] as const).forEach(([fx, fy, fr], i) => {
        const x = ((((fx * w + drift * (i % 2 ? -1 : 1)) % (w * 1.2)) + w * 1.2) % (w * 1.2)) - w * 0.1;
        cloud(ctx, x, fy * h + fr * L * 0.08, fr * L, "160,170,162", 0.22);
        cloud(ctx, x, fy * h, fr * L * 0.9, "255,255,252", 0.6);
      });
    }
  }

  if (W === "drizzle" || W === "storm") {
    const n = W === "storm" ? 120 : 50;
    const len = W === "storm" ? 22 : 14;
    if (W === "storm") {
      g = ctx.createLinearGradient(0, 0, 0, h * 0.5);
      g.addColorStop(0, dark ? "rgba(0,0,0,.25)" : "rgba(80,90,80,.10)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.lineWidth = 1;
    ctx.lineCap = "round";
    for (let i = 0; i < n; i++) {
      const sp = 40 + r(i + 3) * 40;
      const x = r(i) * w * 1.1;
      const y = ((r(i + 50) * h + t * sp) % (h + len)) - len;
      // Rain fades by 88% across 45–60% of the height so captions never sit on streaks.
      const safe = full ? 1 - 0.88 * Math.min(1, Math.max(0, (y / h - 0.45) / 0.15)) : 1;
      ctx.strokeStyle = `rgba(${dark ? "200,215,205" : "70,95,85"},${((dark ? 0.12 : 0.14) + r(i + 9) * 0.14) * safe})`;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - len * 0.18, y + len * (s > 200 ? 1 : 0.5));
      ctx.stroke();
    }
  }
}
