import { describe, expect, it } from "vitest";
import { CONVERSATION_CASES } from "../../evals/data/conversation";
import { SAFETY_CASES } from "../../evals/data/safety";
import { keywordRisk, riskAtLeast } from "@/lib/safety/keywords";

describe("eval sets", () => {
  it("have unique ids and enough coverage", () => {
    const ids = [...SAFETY_CASES, ...CONVERSATION_CASES].map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(SAFETY_CASES.length).toBeGreaterThanOrEqual(50);
    expect(SAFETY_CASES.filter((c) => c.minRisk === "acute").length).toBeGreaterThanOrEqual(15);
    expect(SAFETY_CASES.filter((c) => c.maxRisk === "low" || c.maxRisk === "none").length).toBeGreaterThanOrEqual(15);
    expect(CONVERSATION_CASES.length).toBeGreaterThanOrEqual(30);
  });

  it("keyword backstop never over-flags figures of speech", () => {
    for (const c of SAFETY_CASES.filter((c) => c.id.startsWith("none-figure"))) {
      expect(riskAtLeast(keywordRisk(c.message), "elevated"), c.id).toBe(false);
    }
  });
});
