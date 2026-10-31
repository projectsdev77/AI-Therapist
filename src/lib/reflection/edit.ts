import type { Weather } from "@/lib/conversation/types";
import type { DataStore, Memory, Reflection, ReflectionFeedback } from "@/lib/data/types";

/** Same limits the model's card is held to (see normalizeReflectOutput). */
export const CARD_LIMITS = { title: 80, quote: 200, quotes: 3, insight: 400, nextStep: 160 } as const;

export interface CardEdit {
  title?: string;
  quotes?: string[];
  insight?: string;
  nextStep?: string | null;
}

const clip = (s: string, n: number) => s.trim().slice(0, n);

/** Cleans the person's edits. Empty title or insight keeps the old one; an empty next step removes it. */
export function cleanCardEdit(edit: CardEdit, current: Reflection): Required<CardEdit> {
  return {
    title: edit.title !== undefined && edit.title.trim() ? clip(edit.title, CARD_LIMITS.title) : current.title,
    quotes:
      edit.quotes !== undefined
        ? edit.quotes.map((q) => clip(q, CARD_LIMITS.quote)).filter(Boolean).slice(0, CARD_LIMITS.quotes)
        : current.quotes,
    insight: edit.insight !== undefined && edit.insight.trim() ? clip(edit.insight, CARD_LIMITS.insight) : current.insight,
    nextStep: edit.nextStep !== undefined ? (edit.nextStep?.trim() ? clip(edit.nextStep, CARD_LIMITS.nextStep) : null) : current.nextStep,
  };
}

/** Saves the person's own wording for their card. */
export async function editCard(store: DataStore, sessionId: string, edit: CardEdit): Promise<Reflection> {
  const current = await store.getReflection(sessionId);
  if (!current) throw new Error("This conversation has no card yet.");
  return store.updateReflection(sessionId, { ...cleanCardEdit(edit, current), editedAt: new Date().toISOString() });
}

/** "This feels right" / "Not quite". Pass null to clear it. */
export function setCardFeedback(store: DataStore, sessionId: string, feedback: ReflectionFeedback | null): Promise<Reflection> {
  return store.updateReflection(sessionId, { feedback });
}

/** The person picks the sky for a conversation; Your skies and Home follow it. */
export async function setConversationSky(store: DataStore, sessionId: string, weather: Weather): Promise<Reflection> {
  const reflection = await store.updateReflection(sessionId, { weather, weatherByPerson: true });
  await store.updateSession(sessionId, { weather });
  return reflection;
}

/** What the companion learned from this conversation, so the person can keep or remove each one. */
export async function memoriesFromConversation(store: DataStore, sessionId: string): Promise<Memory[]> {
  return (await store.listMemories()).filter((m) => m.sourceSessionId === sessionId);
}

/**
 * "Not quite": the person says what's off, and the card is rewritten to fit (a collaborative
 * summary they can correct). Memory and notes are left alone.
 */
export async function rewriteCard(store: DataStore, sessionId: string, note: string, profile: { displayName: string | null }): Promise<Reflection> {
  const [messages, card] = await Promise.all([store.listMessages(sessionId), store.getReflection(sessionId)]);
  if (!card) throw new Error("No card to rewrite.");
  const transcript = messages.slice(-60).map((m) => ({ role: m.role === "user" ? ("user" as const) : ("assistant" as const), content: m.content.slice(0, 4000) }));
  if (transcript[0]?.role !== "user") transcript.unshift({ role: "user", content: "(conversation start)" });
  const res = await fetch("/api/reflect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      transcript,
      memoryEnabled: false,
      displayName: profile.displayName,
      clientSummary: null,
      memories: [],
      knownThemes: card.themes,
      correction: { note: note.slice(0, 600), card: { title: card.title, quotes: card.quotes, insight: card.insight, nextStep: card.nextStep } },
    }),
  });
  if (!res.ok) throw new Error("Couldn't rewrite the card right now.");
  const out = (await res.json()) as { reflection: { title: string; quotes: string[]; insight: string; nextStep: string | null } };
  return store.updateReflection(sessionId, {
    title: out.reflection.title,
    quotes: out.reflection.quotes,
    insight: out.reflection.insight,
    nextStep: out.reflection.nextStep,
    // Corrected now, so the companion can lean on it again.
    feedback: null,
    editedAt: new Date().toISOString(),
  });
}
