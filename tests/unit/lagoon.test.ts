import { describe, expect, it } from "vitest";
import { pickCaptions, type CaptionLine } from "@/components/captions/Captions";
import { WEATHERS } from "@/lib/conversation/types";
import { SKY_COLORS, SKY_REASONS, skyGradient, skyLine } from "@/lib/design/skies";

const line = (id: string, speaker: CaptionLine["speaker"], text = id): CaptionLine => ({ id, speaker, text });

describe("captions on screen", () => {
  it("shows the latest exchange with one line of context", () => {
    const v = pickCaptions([line("a", "companion"), line("b", "user"), line("c", "companion"), line("d", "user"), line("e", "companion")]);
    expect([v.prev?.id, v.person?.id, v.companion?.id]).toEqual(["c", "d", "e"]);
  });

  it("while waiting, shows the person's words under the last reply", () => {
    const v = pickCaptions([line("a", "companion"), line("b", "user")]);
    expect([v.prev?.id, v.person?.id, v.companion]).toEqual(["a", "b", null]);
  });

  it("opens with only the greeting, and ignores empty lines", () => {
    const v = pickCaptions([line("a", "companion"), line("x", "companion", "  ")]);
    expect([v.prev, v.person, v.companion?.id]).toEqual([null, null, "a"]);
  });
});

describe("skies", () => {
  it("has a colour and a reason for every sky", () => {
    for (const w of WEATHERS) {
      expect(SKY_COLORS[w]).toHaveLength(2);
      expect(SKY_REASONS[w]).toBeTruthy();
      expect(skyGradient(w)).toContain("160deg");
    }
  });

  it("draws the sky line with one stop per day, empty days as quiet", () => {
    const g = skyLine(["clear", null, "storm"]);
    expect(g).toContain(`${SKY_COLORS.clear[1]} 16.7%`);
    expect(g).toContain(`${SKY_COLORS.quiet[1]} 50.0%`);
    expect(g).toContain(`${SKY_COLORS.storm[1]} 83.3%`);
  });
});
