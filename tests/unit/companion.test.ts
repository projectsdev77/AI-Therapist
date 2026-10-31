import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { describe, expect, it } from "vitest";
import { AnalysisSchema, type CompanionContext } from "@/lib/conversation/protocol";
import { demoReply } from "@/lib/llm/demo";
import { toApiMessages } from "@/lib/llm/converse";
import { buildContextBlock, COMPANION_SYSTEM, SESSION_START } from "@/lib/prompts/companion";

const ctx: CompanionContext = {
  displayName: "Sam",
  memoryEnabled: true,
  clientSummary: "Works in nursing; long shifts; close to sister Maya.",
  memories: [{ fact: "Sister: Maya, close but tense lately", category: "person" }],
  recentReflections: [{ date: "Oct 8", title: "Stretched thin at work", insight: "Rest feels earned only after finishing everything.", nextStep: "Leave on time Friday" }],
  sessionCount: 4,
  mode: "voice",
  localTime: "Friday 9:10 pm",
};

describe("companion prompt", () => {
  it("never claims to be human or licensed, and doesn't add therapy disclaimers", () => {
    expect(COMPANION_SYSTEM).toMatch(/Never claim to be human or to hold a professional license/);
    expect(COMPANION_SYSTEM).toMatch(/Don't volunteer that you're not a therapist/);
  });

  it("includes memory when enabled and hides it when off", () => {
    const on = buildContextBlock(ctx);
    expect(on).toContain("Sister: Maya");
    expect(on).toContain("Stretched thin at work");
    const off = buildContextBlock({ ...ctx, memoryEnabled: false });
    expect(off).not.toContain("Maya");
    expect(off).toContain("Memory is turned off");
  });

  it("always starts the API conversation with a user turn", () => {
    expect(toApiMessages([])[0]).toEqual({ role: "user", content: SESSION_START });
    const msgs = toApiMessages([{ role: "assistant", content: "Hi" }, { role: "user", content: "hey" }]);
    expect(msgs.map((m) => m.role)).toEqual(["user", "assistant", "user"]);
  });

  it("builds a JSON schema for structured analysis output", () => {
    expect(() => betaZodOutputFormat(AnalysisSchema)).not.toThrow();
  });
});

describe("demo mode", () => {
  it("references the last reflection when opening", () => {
    expect(demoReply([], ctx)).toContain("stretched thin at work");
  });

  it("checks safety on risky messages", () => {
    const reply = demoReply([{ role: "assistant", content: "Hi" }, { role: "user", content: "I want to end my life" }], ctx);
    expect(reply).toMatch(/safe right now/);
  });
});
