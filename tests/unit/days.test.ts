import { describe, expect, it } from "vitest";
import { buildDays } from "@/lib/history/days";
import type { Reflection, Session } from "@/lib/data/types";

const session = (id: string, startedAt: string): Session => ({ id, mode: "text", startedAt, endedAt: null, weather: null, toneStart: null, toneEnd: null, title: null });
const reflection = (sessionId: string, weather: Reflection["weather"]): Reflection => ({ id: `r${sessionId}`, sessionId, title: "t", quotes: [], insight: "", nextStep: null, themes: [], weather, createdAt: "" });

describe("buildDays", () => {
  it("covers the window oldest-first and shows a day's heaviest weather", () => {
    const today = new Date(2026, 9, 10, 12);
    const days = buildDays(
      [session("a", new Date(2026, 9, 10, 9).toISOString()), session("b", new Date(2026, 9, 10, 20).toISOString()), session("c", new Date(2026, 9, 8, 9).toISOString())],
      [reflection("a", "clear"), reflection("b", "drizzle"), reflection("c", "breaking")],
      7,
      today,
    );
    expect(days).toHaveLength(7);
    expect(days[6].key).toBe("2026-10-10");
    expect(days[6].weather).toBe("drizzle");
    expect(days[6].sessions.map((s) => s.session.id)).toEqual(["b", "a"]);
    expect(days[4].weather).toBe("breaking");
    expect(days[5].weather).toBeNull();
  });
});
