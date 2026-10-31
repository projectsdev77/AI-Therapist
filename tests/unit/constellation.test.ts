import { describe, expect, it } from "vitest";
import { buildConstellation } from "@/lib/patterns/constellation";

const items = [
  { sessionId: "a", createdAt: "2026-10-01T10:00:00Z", themes: ["work", "sleep"] },
  { sessionId: "b", createdAt: "2026-10-03T10:00:00Z", themes: ["work", "boss"] },
  { sessionId: "c", createdAt: "2026-10-05T10:00:00Z", themes: ["sister", "work"] },
  { sessionId: "d", createdAt: "2026-10-07T10:00:00Z", themes: ["sleep"] },
];

describe("buildConstellation", () => {
  it("makes a star per theme with counts and recency", () => {
    const { stars } = buildConstellation(items);
    const work = stars.find((s) => s.id === "work")!;
    expect(work.count).toBe(3);
    expect(work.sessionIds).toEqual(["a", "b", "c"]);
    expect(stars.find((s) => s.id === "sleep")!.recency).toBe(1);
  });

  it("only shows topics from 2+ conversations, and only links pairs that came up together 2+ times", () => {
    const { stars, links } = buildConstellation(items);
    expect(stars.map((s) => s.id).sort()).toEqual(["sleep", "work"]);
    expect(links).toEqual([]);
    const together = buildConstellation([...items, { sessionId: "e", createdAt: "2026-10-09T10:00:00Z", themes: ["work", "sleep"] }]);
    expect(together.links).toContainEqual({ a: "sleep", b: "work", weight: 2 });
  });

  it("ignores diagnoses and talking-about-talking tags", () => {
    const { stars } = buildConstellation([
      { sessionId: "a", createdAt: "2026-10-01T10:00:00Z", themes: ["depression", "venting", "family"] },
      { sessionId: "b", createdAt: "2026-10-02T10:00:00Z", themes: ["Depression", "reaching out", "family"] },
    ]);
    expect(stars.map((s) => s.id)).toEqual(["family"]);
  });

  it("a single conversation makes no pattern", () => {
    expect(buildConstellation([items[0]]).stars).toEqual([]);
  });

  it("lays stars out inside the canvas, deterministically", () => {
    const one = buildConstellation(items, 24, 1);
    const two = buildConstellation(items, 24, 1);
    expect(one.stars.map((s) => [s.x, s.y])).toEqual(two.stars.map((s) => [s.x, s.y]));
    for (const s of one.stars) {
      expect(s.x).toBeGreaterThanOrEqual(0.05);
      expect(s.x).toBeLessThanOrEqual(0.95);
      expect(s.y).toBeGreaterThanOrEqual(0.05);
      expect(s.y).toBeLessThanOrEqual(0.95);
    }
  });

  it("handles empty input", () => {
    expect(buildConstellation([])).toEqual({ stars: [], links: [] });
  });
});
