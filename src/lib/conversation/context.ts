import type { CompanionContext } from "./protocol";
import { LIMITS } from "./protocol";
import type { DataStore, Profile, SessionMode } from "@/lib/data/types";

const dateFmt = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" });
const timeFmt = new Intl.DateTimeFormat(undefined, { weekday: "long", hour: "numeric", minute: "2-digit" });

/** Assembles what the companion should know, from the person's own stored data. */
export async function buildCompanionContext(store: DataStore, profile: Profile, mode: SessionMode, excludeSessionId?: string): Promise<CompanionContext> {
  const sessions = (await store.listSessions(500)).filter((s) => s.id !== excludeSessionId);
  const base = {
    displayName: profile.displayName,
    memoryEnabled: profile.memoryEnabled,
    sessionCount: sessions.length,
    mode,
    localTime: timeFmt.format(new Date()),
  };
  if (!profile.memoryEnabled) {
    return { ...base, clientSummary: null, memories: [], recentReflections: [] };
  }
  const [memories, reflections] = await Promise.all([store.listMemories(), store.listReflections(LIMITS.reflections + 1)]);
  return {
    ...base,
    clientSummary: profile.clientSummary,
    memories: memories.slice(0, LIMITS.memories).map((m) => ({ fact: m.fact, category: m.category })),
    recentReflections: reflections
      .filter((r) => r.sessionId !== excludeSessionId)
      .slice(0, LIMITS.reflections)
      .map((r) => ({
        date: dateFmt.format(new Date(r.createdAt)),
        title: r.title,
        insight: r.insight,
        nextStep: r.nextStep,
        ...(r.feedback === "not_quite" ? { notQuite: true } : {}),
      })),
  };
}
