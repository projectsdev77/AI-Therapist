import type { CompanionContext } from "./protocol";
import { LIMITS } from "./protocol";
import type { DataStore, Profile, SessionMode } from "@/lib/data/types";

const dateFmt = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" });
const timeFmt = new Intl.DateTimeFormat(undefined, { weekday: "long", hour: "numeric", minute: "2-digit" });

/** Assembles what the companion should know, from the person's own stored data. */
export async function buildCompanionContext(store: DataStore, profile: Profile, mode: SessionMode, excludeSessionId?: string): Promise<CompanionContext> {
  const sessions = (await store.listSessions(500)).filter((s) => s.id !== excludeSessionId);
  // Safety follow-up works even with memory off: it's about care, not notes.
  const recentEvents = await store.listSafetyEvents(10).catch(() => []);
  const twoWeeks = Date.now() - 14 * 86_400_000;
  const safety = recentEvents.find(
    (e) => (e.riskLevel === "acute" || e.riskLevel === "elevated") && Date.parse(e.createdAt) > twoWeeks && e.sessionId !== excludeSessionId,
  );
  const base = {
    displayName: profile.displayName,
    memoryEnabled: profile.memoryEnabled,
    sessionCount: sessions.length,
    mode,
    localTime: timeFmt.format(new Date()),
    ...(sessions[0] ? { lastTalkedMinutesAgo: Math.max(0, Math.round((Date.now() - Date.parse(sessions[0].endedAt ?? sessions[0].startedAt)) / 60_000)) } : {}),
    recentSafety: safety ? { date: dateFmt.format(new Date(safety.createdAt)), level: safety.riskLevel as "elevated" | "acute" } : null,
    hasSafetyPlan: Boolean(profile.safetyPlan),
  };
  if (!profile.memoryEnabled) {
    return { ...base, clientSummary: null, memories: [], recentReflections: [], lastConversation: null };
  }
  const [memories, reflections] = await Promise.all([store.listMemories(), store.listReflections(LIMITS.reflections + 1)]);
  // The most recent finished conversation: ask about its step once, in the next conversation.
  const last = sessions.find((x) => x.endedAt);
  const lastCard = last ? reflections.find((r) => r.sessionId === last.id) : undefined;
  return {
    ...base,
    lastConversation: last
      ? { date: dateFmt.format(new Date(last.startedAt)), openStep: lastCard?.nextStep ?? null, heard: last.heard ?? null }
      : null,
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
