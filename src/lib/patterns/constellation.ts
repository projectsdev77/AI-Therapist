import { seeded } from "@/lib/design/random";
import { isUsableTheme } from "./tags";

export interface ThemeInput {
  themes: string[];
  sessionId: string;
  createdAt: string;
}

export interface Star {
  id: string;
  count: number;
  /** 0..1, 1 = mentioned most recently. */
  recency: number;
  sessionIds: string[];
  x: number;
  y: number;
}

export interface Link {
  a: string;
  b: string;
  weight: number;
}

export interface Constellation {
  stars: Star[];
  links: Link[];
}

/**
 * Builds a constellation from reflection themes: a star per theme that has come up in at least
 * `minCount` conversations, lines between themes that came up together at least that often,
 * laid out with a small deterministic force simulation in a 0..1 square.
 */
/** A topic becomes a star once it has come up in this many separate conversations. */
export const MIN_CONVERSATIONS = 2;

export function buildConstellation(items: ThemeInput[], maxStars = 24, minCount = MIN_CONVERSATIONS): Constellation {
  const byTheme = new Map<string, { count: number; last: number; sessionIds: string[] }>();
  const pairs = new Map<string, number>();
  const times = items.map((i) => new Date(i.createdAt).getTime());
  const minT = Math.min(...times);
  const maxT = Math.max(...times);

  items.forEach((item, idx) => {
    const unique = [...new Set(item.themes.map((t) => t.trim().toLowerCase()).filter(isUsableTheme))];
    for (const t of unique) {
      const entry = byTheme.get(t) ?? { count: 0, last: 0, sessionIds: [] };
      entry.count++;
      entry.last = Math.max(entry.last, times[idx]);
      entry.sessionIds.push(item.sessionId);
      byTheme.set(t, entry);
    }
    for (let i = 0; i < unique.length; i++) {
      for (let j = i + 1; j < unique.length; j++) {
        const key = [unique[i], unique[j]].sort().join("\u0000");
        pairs.set(key, (pairs.get(key) ?? 0) + 1);
      }
    }
  });

  const top = [...byTheme.entries()]
    .filter(([, e]) => e.count >= minCount)
    .sort((a, b) => b[1].count - a[1].count || b[1].last - a[1].last).slice(0, maxStars);
  const keep = new Set(top.map(([t]) => t));
  const rnd = seeded(top.length * 7919 + items.length);
  const stars: Star[] = top.map(([id, e], i) => {
    const angle = (i / Math.max(1, top.length)) * Math.PI * 2;
    return {
      id,
      count: e.count,
      recency: maxT === minT ? 1 : (e.last - minT) / (maxT - minT),
      sessionIds: e.sessionIds,
      x: 0.5 + Math.cos(angle) * 0.3 + (rnd() - 0.5) * 0.05,
      y: 0.5 + Math.sin(angle) * 0.3 + (rnd() - 0.5) * 0.05,
    };
  });
  const links: Link[] = [...pairs.entries()]
    .map(([key, weight]) => {
      const [a, b] = key.split("\u0000");
      return { a, b, weight };
    })
    // A line means two topics keep coming up together, not that they shared one card.
    .filter((l) => l.weight >= minCount && keep.has(l.a) && keep.has(l.b));

  layout(stars, links);
  return { stars, links };
}

function layout(stars: Star[], links: Link[], iterations = 240) {
  if (stars.length < 2) {
    stars.forEach((s) => {
      s.x = 0.5;
      s.y = 0.5;
    });
    return;
  }
  const index = new Map(stars.map((s, i) => [s.id, i]));
  const k = 0.75 / Math.sqrt(stars.length);
  for (let it = 0; it < iterations; it++) {
    const temp = 0.05 * (1 - it / iterations) + 0.002;
    const dx = new Array(stars.length).fill(0);
    const dy = new Array(stars.length).fill(0);
    for (let i = 0; i < stars.length; i++) {
      for (let j = i + 1; j < stars.length; j++) {
        const ex = stars[i].x - stars[j].x;
        const ey = stars[i].y - stars[j].y;
        const d2 = Math.max(ex * ex + ey * ey, 1e-4);
        if (d2 > 0.16) continue; // only nearby stars push each other
        const f = (k * k) / d2;
        dx[i] += ex * f;
        dy[i] += ey * f;
        dx[j] -= ex * f;
        dy[j] -= ey * f;
      }
    }
    for (const l of links) {
      const i = index.get(l.a)!;
      const j = index.get(l.b)!;
      const ex = stars[i].x - stars[j].x;
      const ey = stars[i].y - stars[j].y;
      const d = Math.sqrt(ex * ex + ey * ey) || 1e-3;
      const f = (d * Math.min(l.weight, 4)) / k / 6;
      dx[i] -= (ex / d) * f;
      dy[i] -= (ey / d) * f;
      dx[j] += (ex / d) * f;
      dy[j] += (ey / d) * f;
    }
    for (let i = 0; i < stars.length; i++) {
      // Gentle pull to the center keeps unconnected stars on the canvas.
      dx[i] += (0.5 - stars[i].x) * 0.08;
      dy[i] += (0.5 - stars[i].y) * 0.08;
      const len = Math.sqrt(dx[i] * dx[i] + dy[i] * dy[i]) || 1;
      stars[i].x += (dx[i] / len) * Math.min(len, temp);
      stars[i].y += (dy[i] / len) * Math.min(len, temp);
    }
  }
  // Fit into a padded square.
  const xs = stars.map((s) => s.x);
  const ys = stars.map((s) => s.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const span = Math.max(maxX - minX, maxY - minY, 1e-3);
  for (const s of stars) {
    s.x = 0.1 + ((s.x - minX) / span) * 0.8 + (0.8 - ((maxX - minX) / span) * 0.8) / 2;
    s.y = 0.1 + ((s.y - minY) / span) * 0.8 + (0.8 - ((maxY - minY) / span) * 0.8) / 2;
  }
  // Keep a minimum distance so stars and labels don't collide.
  const minDist = Math.min(0.16, 0.7 / Math.sqrt(stars.length));
  for (let pass = 0; pass < 30; pass++) {
    for (let i = 0; i < stars.length; i++) {
      for (let j = i + 1; j < stars.length; j++) {
        const ex = stars[j].x - stars[i].x;
        const ey = stars[j].y - stars[i].y;
        const d = Math.sqrt(ex * ex + ey * ey) || 1e-3;
        if (d < minDist) {
          const push = (minDist - d) / 2;
          stars[i].x -= (ex / d) * push;
          stars[i].y -= (ey / d) * push;
          stars[j].x += (ex / d) * push;
          stars[j].y += (ey / d) * push;
        }
      }
    }
  }
  for (const s of stars) {
    s.x = Math.min(0.92, Math.max(0.08, s.x));
    s.y = Math.min(0.92, Math.max(0.08, s.y));
  }
}
