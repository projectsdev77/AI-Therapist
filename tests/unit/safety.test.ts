import { describe, expect, it } from "vitest";
import { keywordRisk, maxRisk, riskAtLeast } from "@/lib/safety/keywords";

describe("keywordRisk", () => {
  it.each([
    ["I want to kill myself", "acute"],
    ["sometimes I think about ending my life", "acute"],
    ["I've been feeling suicidal", "acute"],
    ["I'm going to hurt him", "acute"],
    ["I'm not safe at home", "acute"],
    ["I don't want to be alive anymore", "elevated"],
    ["I used to self-harm", "elevated"],
    ["I wish I was never born", "elevated"],
    ["Work is killing me lol", "none"],
    ["I had a long day", "none"],
  ])("%s → %s", (text, expected) => {
    expect(keywordRisk(text)).toBe(expected);
  });

  it("handles curly apostrophes", () => {
    expect(keywordRisk("I don’t want to wake up")).toBe("elevated");
  });
});

describe("maxRisk", () => {
  it("only raises", () => {
    expect(maxRisk("low", "acute", "none")).toBe("acute");
    expect(maxRisk(null, undefined)).toBe("none");
    expect(riskAtLeast("elevated", "elevated")).toBe(true);
    expect(riskAtLeast("low", "elevated")).toBe(false);
  });
});
