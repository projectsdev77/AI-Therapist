import type { Weather } from "@/lib/conversation/types";
import type { Reflection, Session } from "@/lib/data/types";

export interface DayEntry {
  /** Local date key, YYYY-MM-DD. */
  key: string;
  date: Date;
  sessions: { session: Session; reflection: Reflection | null }[];
  /** The day's sky: the heaviest weather of the day's sessions, so hard days aren't hidden. */
  weather: Weather | null;
}

const WEIGHT: Record<Weather, number> = { storm: 4, drizzle: 3, haze: 2, breaking: 1, clear: 0, quiet: 0 };

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** The last `days` days (oldest first), each with that day's sessions. */
export function buildDays(sessions: Session[], reflections: Reflection[], days = 30, today = new Date()): DayEntry[] {
  const byId = new Map(reflections.map((r) => [r.sessionId, r]));
  const grouped = new Map<string, DayEntry["sessions"]>();
  for (const s of sessions) {
    const key = dayKey(new Date(s.startedAt));
    grouped.set(key, [...(grouped.get(key) ?? []), { session: s, reflection: byId.get(s.id) ?? null }]);
  }
  const out: DayEntry[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
    const key = dayKey(date);
    const daySessions = (grouped.get(key) ?? []).sort((a, b) => b.session.startedAt.localeCompare(a.session.startedAt));
    const weathers = daySessions.map((d) => d.reflection?.weather ?? d.session.weather).filter((w): w is Weather => w !== null);
    const weather = heaviest(weathers);
    out.push({ key, date, sessions: daySessions, weather });
  }
  return out;
}

/** The day's sky: the heaviest of its conversations' skies, so hard days aren't hidden. */
export function heaviest(weathers: Weather[]): Weather | null {
  return weathers.length ? weathers.reduce((a, b) => (WEIGHT[b] > WEIGHT[a] ? b : a)) : null;
}
