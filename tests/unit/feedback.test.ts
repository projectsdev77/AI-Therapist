import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildContextBlock } from "@/lib/prompts/companion";
import { buildCompanionContext } from "@/lib/conversation/context";
import { STARTERS } from "@/lib/conversation/starters";
import { LocalStore } from "@/lib/data/localStore";
import { cleanCardEdit, editCard, memoriesFromConversation, setCardFeedback, setConversationSky } from "@/lib/reflection/edit";
import { ABANDONED_AFTER_MS, finishPendingSessions } from "@/lib/reflection/pending";

let store: LocalStore;
let n = 0;
let reflectCalls = 0;

beforeEach(() => {
  store = new LocalStore(`feedback-${n++}`);
  reflectCalls = 0;
  vi.stubGlobal("fetch", async () => {
    reflectCalls++;
    return Response.json({
      reflection: { title: "Talking it through", quotes: ["hi"], insight: "You named it.", nextStep: null, themes: ["work"] },
      memory: { add: [{ fact: `Fact ${reflectCalls}`, category: "other" }], update: [], remove: [] },
      clientSummary: `Summary ${reflectCalls}`,
    });
  });
});
afterEach(() => vi.unstubAllGlobals());

async function conversation(opts: { ended: boolean; lastAt?: string }) {
  const s = await store.createSession("text");
  await store.addMessage({ sessionId: s.id, role: "user", content: "hi", tone: null, riskLevel: "none", interrupted: false, createdAt: opts.lastAt });
  if (opts.ended) await store.updateSession(s.id, { endedAt: new Date().toISOString() });
  return s;
}

describe("finishing conversations whose card never got made", () => {
  it("makes the card and memories for an ended conversation", async () => {
    const s = await conversation({ ended: true });
    expect(await finishPendingSessions(store)).toBe(1);
    expect((await store.getReflection(s.id))?.title).toBe("Talking it through");
    expect((await memoriesFromConversation(store, s.id)).map((m) => m.fact)).toEqual(["Fact 1"]);
    expect((await store.getProfile()).clientSummary).toBe("Summary 1");
    // Nothing left to do the second time.
    expect(await finishPendingSessions(store)).toBe(0);
  });

  it("ends and finishes a conversation left open for hours, but not a recent one", async () => {
    const old = new Date(Date.now() - ABANDONED_AFTER_MS - 60_000).toISOString();
    const abandoned = await conversation({ ended: false, lastAt: old });
    const live = await conversation({ ended: false });
    expect(await finishPendingSessions(store)).toBe(1);
    expect((await store.getSession(abandoned.id))?.endedAt).toBe(old);
    expect(await store.getReflection(live.id)).toBeNull();
  });

  it("skips conversations where the person never spoke, and stops on failure", async () => {
    const empty = await store.createSession("text");
    await store.updateSession(empty.id, { endedAt: new Date().toISOString() });
    await conversation({ ended: true });
    vi.stubGlobal("fetch", async () => Response.json({ error: "busy" }, { status: 429 }));
    expect(await finishPendingSessions(store)).toBe(0);
  });
});

describe("the person's say over their card", () => {
  async function withCard() {
    const s = await conversation({ ended: true });
    await store.saveReflection({ sessionId: s.id, title: "Old title", quotes: ["a", "b"], insight: "Old insight", nextStep: "Walk", themes: [], weather: "storm" });
    return s;
  }

  it("cleans edits: blank title keeps the old one, blank next step removes it", async () => {
    const s = await withCard();
    const card = (await store.getReflection(s.id))!;
    expect(card.feedback).toBeNull();
    expect(cleanCardEdit({ title: "  ", nextStep: " ", quotes: ["x".repeat(500), ""] }, card)).toMatchObject({
      title: "Old title",
      nextStep: null,
      quotes: ["x".repeat(200)],
      insight: "Old insight",
    });
    const edited = await editCard(store, s.id, { insight: "My own words" });
    expect(edited.insight).toBe("My own words");
    expect(edited.editedAt).not.toBeNull();
  });

  it("records feedback, and the companion is told not to lean on a card that wasn't right", async () => {
    const s = await withCard();
    await setCardFeedback(store, s.id, "not_quite");
    const ctx = await buildCompanionContext(store, await store.getProfile(), "text");
    expect(ctx.recentReflections[0].notQuite).toBe(true);
    expect(buildContextBlock(ctx)).toContain("wasn't quite right");
  });

  it("lets the person choose the sky, for the card and the conversation", async () => {
    const s = await withCard();
    const card = await setConversationSky(store, s.id, "clear");
    expect(card).toMatchObject({ weather: "clear", weatherByPerson: true });
    expect((await store.getSession(s.id))?.weather).toBe("clear");
  });
});

describe("support style and starters", () => {
  it("tells the companion what kind of support was chosen", async () => {
    const ctx = await buildCompanionContext(store, await store.getProfile(), "text");
    expect(buildContextBlock({ ...ctx, supportStyle: "listen" })).toMatch(/just listen/);
    expect(buildContextBlock(ctx)).not.toMatch(/They asked you to/);
  });

  it("offers starters with unique ids, and the listen starter sets listening", () => {
    expect(new Set(STARTERS.map((s) => s.id)).size).toBe(STARTERS.length);
    expect(STARTERS.find((s) => s.id === "listen")?.supportStyle).toBe("listen");
  });
});
