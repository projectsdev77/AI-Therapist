import { describe, expect, it } from "vitest";
import { BREATH_PATTERNS, cycleLength, sampleBreath } from "@/lib/breath/patterns";

const box = BREATH_PATTERNS.find((p) => p.id === "box")!;
const fourSevenEight = BREATH_PATTERNS.find((p) => p.id === "478")!;

describe("sampleBreath", () => {
  it("walks the box pattern in order", () => {
    expect(sampleBreath(box, 0).phase).toBe("in");
    expect(sampleBreath(box, 4.5).phase).toBe("hold-in");
    expect(sampleBreath(box, 8.5).phase).toBe("out");
    expect(sampleBreath(box, 12.5).phase).toBe("hold-out");
    expect(sampleBreath(box, 16.5).phase).toBe("in");
  });

  it("skips zero-length phases", () => {
    expect(cycleLength(fourSevenEight)).toBe(19);
    expect(sampleBreath(fourSevenEight, 18.9).phase).toBe("out");
    expect(sampleBreath(fourSevenEight, 19.1).phase).toBe("in");
  });

  it("fills on the inhale and empties on the exhale", () => {
    expect(sampleBreath(box, 0).fullness).toBeCloseTo(0);
    expect(sampleBreath(box, 3.999).fullness).toBeCloseTo(1, 2);
    expect(sampleBreath(box, 6).fullness).toBe(1);
    expect(sampleBreath(box, 11.999).fullness).toBeCloseTo(0, 2);
  });

  it("counts down remaining seconds", () => {
    expect(sampleBreath(box, 0.2).remaining).toBe(4);
    expect(sampleBreath(box, 3.2).remaining).toBe(1);
  });
});
