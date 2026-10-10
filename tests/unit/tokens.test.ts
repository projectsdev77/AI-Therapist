import { describe, expect, it } from "vitest";
import { mixRGB, parseColor } from "@/lib/design/tokens";

describe("parseColor", () => {
  it("parses hex and rgb()", () => {
    expect(parseColor("#ff0000")).toEqual([1, 0, 0]);
    expect(parseColor("#0f0")).toEqual([0, 1, 0]);
    expect(parseColor("rgba(0, 0, 255, 0.5)")).toEqual([0, 0, 1]);
  });

  it("falls back on garbage", () => {
    expect(parseColor("nope")).toHaveLength(3);
  });

  it("mixes", () => {
    expect(mixRGB([0, 0, 0], [1, 1, 1], 0.5)).toEqual([0.5, 0.5, 0.5]);
  });
});
