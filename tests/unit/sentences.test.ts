import { describe, expect, it } from "vitest";
import { SentenceChunker } from "@/lib/voice/sentences";

describe("SentenceChunker", () => {
  it("emits sentences as they complete across chunks", () => {
    const c = new SentenceChunker(10);
    expect(c.push("That sounds really ha")).toEqual([]);
    expect(c.push("rd to carry. What was the ")).toEqual(["That sounds really hard to carry."]);
    expect(c.push("hardest part?")).toEqual([]);
    expect(c.flush()).toBe("What was the hardest part?");
  });

  it("merges very short sentences with the next one", () => {
    const c = new SentenceChunker(20);
    expect(c.push("Oh. I see. That makes a lot of sense. ")).toEqual(["Oh. I see. That makes a lot of sense."]);
  });

  it("keeps quotes with their sentence", () => {
    const c = new SentenceChunker(5);
    expect(c.push('She said "enough." Then left. ')).toEqual(['She said "enough."', "Then left."]);
  });
});
