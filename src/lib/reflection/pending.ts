import type { DataStore } from "@/lib/data/types";
import { clearPaused, isPaused } from "@/lib/conversation/paused";
import { finalizeSession } from "./finalize";

/** A conversation with no activity for this long, and never ended, counts as finished. */
export const ABANDONED_AFTER_MS = 2 * 60 * 60 * 1000;
/** Left with "I'll be back": wait a day before finishing it. */
export const PAUSED_AFTER_MS = 24 * 60 * 60 * 1000;

/**
 * Makes the cards (and memory updates) that never happened: conversations that ended
 * while the tab was closing, and ones left open without pressing End. Runs in order,
 * newest first, and stops at the first failure (offline, rate limit) to retry next time.
 * Returns how many it finished.
 */
export async function finishPendingSessions(store: DataStore, now = Date.now(), limit = 20): Promise<number> {
  const sessions = await store.listSessions(limit);
  let finished = 0;
  for (const session of sessions) {
    if (await store.getReflection(session.id)) continue;
    const messages = await store.listMessages(session.id);
    if (!messages.some((m) => m.role === "user")) continue;
    if (!session.endedAt) {
      const lastActivity = messages[messages.length - 1].createdAt;
      const wait = isPaused(session.id) ? PAUSED_AFTER_MS : ABANDONED_AFTER_MS;
      if (now - Date.parse(lastActivity) < wait) continue;
      await store.updateSession(session.id, { endedAt: lastActivity });
      clearPaused(session.id);
    }
    try {
      // Fresh profile each time: the previous card may have rewritten the summary.
      await finalizeSession(store, await store.getProfile(), session.id);
      finished++;
    } catch {
      break;
    }
  }
  return finished;
}
