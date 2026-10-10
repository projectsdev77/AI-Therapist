import { beforeEach, describe, expect, it } from "vitest";
import { LocalStore } from "@/lib/data/localStore";

let store: LocalStore;
let n = 0;

beforeEach(() => {
  store = new LocalStore(`test-${n++}`);
});

describe("LocalStore", () => {
  it("creates a profile with memory on by default", async () => {
    const profile = await store.getProfile();
    expect(profile.memoryEnabled).toBe(true);
    expect(profile.consentedAt).toBeNull();
    expect((await store.getProfile()).id).toBe(profile.id);
  });

  it("stores sessions, messages, and reflections", async () => {
    const s1 = await store.createSession("text");
    await new Promise((r) => setTimeout(r, 5));
    const s2 = await store.createSession("voice");
    await store.addMessage({ sessionId: s1.id, role: "user", content: "hi", tone: null, riskLevel: "none", interrupted: false });
    await store.addMessage({ sessionId: s1.id, role: "companion", content: "hello", tone: "warm", riskLevel: null, interrupted: false });
    await store.saveReflection({ sessionId: s1.id, title: "t", quotes: ["q"], insight: "i", nextStep: null, themes: ["work"], weather: "clear" });

    expect((await store.listSessions()).map((s) => s.id)).toEqual([s2.id, s1.id]);
    expect((await store.listMessages(s1.id)).map((m) => m.content)).toEqual(["hi", "hello"]);
    expect((await store.getReflection(s1.id))?.themes).toEqual(["work"]);
  });

  it("deleting a session removes its messages, reflection, and sourced memories", async () => {
    const s = await store.createSession("text");
    await store.addMessage({ sessionId: s.id, role: "user", content: "x", tone: null, riskLevel: null, interrupted: false });
    await store.saveReflection({ sessionId: s.id, title: "t", quotes: [], insight: "i", nextStep: null, themes: [], weather: "haze" });
    await store.addMemory({ fact: "from session", category: "other", sourceSessionId: s.id });
    const kept = await store.addMemory({ fact: "manual", category: "other", sourceSessionId: null });

    await store.deleteSession(s.id);

    expect(await store.getSession(s.id)).toBeNull();
    expect(await store.listMessages(s.id)).toEqual([]);
    expect(await store.getReflection(s.id)).toBeNull();
    expect((await store.listMemories()).map((m) => m.id)).toEqual([kept.id]);
  });

  it("edits memories and exports everything", async () => {
    const m = await store.addMemory({ fact: "Sister: Maya", category: "person", sourceSessionId: null });
    await store.updateMemory(m.id, { fact: "Sister: Maya, close" });
    const bundle = await store.exportAll();
    expect(bundle.memories[0].fact).toBe("Sister: Maya, close");
  });

  it("deletes everything", async () => {
    await store.createSession("text");
    await store.addMemory({ fact: "f", category: "other", sourceSessionId: null });
    await store.deleteEverything();
    expect(await store.listSessions()).toEqual([]);
    expect(await store.listMemories()).toEqual([]);
  });
});
