import type { Tone } from "@/lib/conversation/types";
import { sessionWeather } from "@/lib/conversation/weather";
import type { DataStore, Profile, Reflection } from "@/lib/data/types";
import { SESSION_START } from "@/lib/prompts/companion";
import type { ReflectOutput, ReflectRequest } from "./protocol";

const inFlight = new Map<string, Promise<Reflection | null>>();

/**
 * Turns an ended session into a reflection card, sets its weather, and updates
 * memory and the client summary. Idempotent per session.
 */
export function finalizeSession(store: DataStore, profile: Profile, sessionId: string): Promise<Reflection | null> {
  const key = `${store.kind}:${sessionId}`;
  let job = inFlight.get(key);
  if (!job) {
    job = run(store, profile, sessionId).finally(() => inFlight.delete(key));
    inFlight.set(key, job);
  }
  return job;
}

async function run(store: DataStore, profile: Profile, sessionId: string): Promise<Reflection | null> {
  const existing = await store.getReflection(sessionId);
  if (existing) return existing;
  const messages = await store.listMessages(sessionId);
  const firstUser = messages.findIndex((m) => m.role === "user");
  if (firstUser < 0) return null;

  const [memories, reflections] = await Promise.all([
    profile.memoryEnabled ? store.listMemories() : Promise.resolve([]),
    store.listReflections(50),
  ]);

  const request: ReflectRequest = {
    transcript: messages.slice(-60).map((m) => ({ role: m.role === "user" ? "user" : "assistant", content: m.content.slice(0, 4000) })),
    memoryEnabled: profile.memoryEnabled,
    displayName: profile.displayName,
    clientSummary: profile.clientSummary,
    memories: memories.slice(0, 80).map((m) => ({ id: m.id, fact: m.fact, category: m.category })),
    knownThemes: [...new Set(reflections.flatMap((r) => r.themes))].slice(0, 60),
  };
  if (request.transcript[0]?.role !== "user") request.transcript.unshift({ role: "user", content: SESSION_START });

  const res = await fetch("/api/reflect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => null))?.error ?? "Couldn't make a reflection right now.");
  const out = (await res.json()) as ReflectOutput;

  // Companion replies carry the person's tone at that point; their order gives the arc.
  const tones = messages
    .slice(firstUser)
    .filter((m) => m.role === "companion" && m.tone)
    .map((m) => m.tone as Tone);
  const weather = sessionWeather(tones);

  const reflection = await store.saveReflection({ sessionId, ...out.reflection, weather });
  await store.updateSession(sessionId, { weather, title: out.reflection.title });

  if (profile.memoryEnabled) {
    for (const m of out.memory.add) await store.addMemory({ ...m, sourceSessionId: sessionId });
    for (const u of out.memory.update) await store.updateMemory(u.id, { fact: u.fact }).catch(() => undefined);
    for (const id of out.memory.remove) await store.deleteMemory(id);
    if (out.clientSummary) {
      await store.updateProfile({ clientSummary: out.clientSummary, clientSummaryUpdatedAt: new Date().toISOString() });
    }
  }
  return reflection;
}
