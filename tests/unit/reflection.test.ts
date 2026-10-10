import { describe, expect, it } from "vitest";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { sessionWeather } from "@/lib/conversation/weather";
import { demoReflection } from "@/lib/llm/reflect";
import { normalizeReflectOutput, ReflectOutputSchema, type ReflectRequest } from "@/lib/reflection/protocol";

const req: ReflectRequest = {
  transcript: [
    { role: "assistant", content: "Hi, what's on your mind?" },
    { role: "user", content: "Work has been overwhelming. My boss keeps adding deadlines." },
    { role: "assistant", content: "That sounds like a lot." },
    { role: "user", content: "And I can't sleep because of it." },
  ],
  memoryEnabled: true,
  displayName: null,
  clientSummary: null,
  memories: [{ id: "m1", fact: "Works as a nurse", category: "situation" }],
  knownThemes: ["work"],
};

describe("sessionWeather", () => {
  it("reads the arc of a session", () => {
    expect(sessionWeather([])).toBe("clear");
    expect(sessionWeather(["calm", "warm"])).toBe("clear");
    expect(sessionWeather(["heavy", "heavy", "heavy"])).toBe("storm");
    expect(sessionWeather(["anxious", "anxious", "neutral"])).toBe("haze");
    expect(sessionWeather(["anxious", "heavy", "anxious"])).toBe("drizzle");
    expect(sessionWeather(["heavy", "anxious", "calm", "hopeful"])).toBe("breaking");
    expect(sessionWeather(["frustrated", "frustrated", "neutral"])).toBe("storm");
    expect(sessionWeather(["neutral", "neutral"])).toBe("haze");
  });
});

describe("reflection output", () => {
  it("has a schema the API can use", () => {
    expect(() => betaZodOutputFormat(ReflectOutputSchema)).not.toThrow();
  });

  it("drops memory changes for unknown ids and when memory is off", () => {
    const out = normalizeReflectOutput(
      {
        reflection: { title: "", quotes: ['"quoted"'], insight: "x", nextStep: " ", themes: ["Work", "work", "sleep"] },
        memory: { add: [{ fact: "Boss adds deadlines", category: "situation" }], update: [{ id: "nope", fact: "x" }, { id: "m1", fact: "Nurse, night shifts" }], remove: ["nope"] },
        clientSummary: "summary",
      },
      req,
    );
    expect(out.reflection.title).toBe("A conversation");
    expect(out.reflection.quotes).toEqual(["quoted"]);
    expect(out.reflection.nextStep).toBeNull();
    expect(out.reflection.themes).toEqual(["work", "sleep"]);
    expect(out.memory.update).toEqual([{ id: "m1", fact: "Nurse, night shifts" }]);
    expect(out.memory.remove).toEqual([]);

    const off = normalizeReflectOutput(out, { ...req, memoryEnabled: false });
    expect(off.memory.add).toEqual([]);
    expect(off.clientSummary).toBeNull();
  });

  it("demo reflection quotes the person's own words", () => {
    const out = demoReflection(req);
    expect(out.reflection.quotes[0]).toContain("Work has been overwhelming.");
    expect(out.reflection.themes).toContain("work");
  });
});
