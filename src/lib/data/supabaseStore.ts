import type { SupabaseClient } from "@supabase/supabase-js";
import type { RiskLevel, Tone, Weather } from "@/lib/conversation/types";
import { defaultProfile } from "./defaults";
import type {
  DataStore,
  ExportBundle,
  Memory,
  MemoryCategory,
  Message,
  Profile,
  Reflection,
  ReflectionFeedback,
  ReflectionInput,
  ReflectionPatch,
  SafetyEvent,
  Session,
  SessionMode,
} from "./types";

/* Row shapes (snake_case, as stored). */
interface ProfileRow {
  id: string;
  display_name: string | null;
  memory_enabled: boolean;
  voice_id: string | null;
  region: string | null;
  consented_at: string | null;
  client_summary: string | null;
  client_summary_updated_at: string | null;
  created_at: string;
}
interface SessionRow {
  id: string;
  mode: SessionMode;
  started_at: string;
  ended_at: string | null;
  weather: Weather | null;
  tone_start: Tone | null;
  tone_end: Tone | null;
  title: string | null;
}
interface MessageRow {
  id: string;
  session_id: string;
  role: "user" | "companion";
  content: string;
  tone: Tone | null;
  risk_level: RiskLevel | null;
  interrupted: boolean;
  created_at: string;
}
interface ReflectionRow {
  id: string;
  session_id: string;
  title: string;
  quotes: string[];
  insight: string;
  next_step: string | null;
  themes: string[];
  weather: Weather;
  feedback: ReflectionFeedback | null;
  edited_at: string | null;
  weather_by_person: boolean | null;
  created_at: string;
}
interface MemoryRow {
  id: string;
  fact: string;
  category: MemoryCategory;
  source_session_id: string | null;
  created_at: string;
  updated_at: string;
}

const toProfile = (r: ProfileRow): Profile => ({
  id: r.id,
  displayName: r.display_name,
  memoryEnabled: r.memory_enabled,
  voiceId: r.voice_id,
  region: r.region,
  consentedAt: r.consented_at,
  clientSummary: r.client_summary,
  clientSummaryUpdatedAt: r.client_summary_updated_at,
  createdAt: r.created_at,
});
const fromProfilePatch = (p: Partial<Profile>) => {
  const row: Record<string, unknown> = {};
  if ("displayName" in p) row.display_name = p.displayName;
  if ("memoryEnabled" in p) row.memory_enabled = p.memoryEnabled;
  if ("voiceId" in p) row.voice_id = p.voiceId;
  if ("region" in p) row.region = p.region;
  if ("consentedAt" in p) row.consented_at = p.consentedAt;
  if ("clientSummary" in p) row.client_summary = p.clientSummary;
  if ("clientSummaryUpdatedAt" in p) row.client_summary_updated_at = p.clientSummaryUpdatedAt;
  return row;
};
const toSession = (r: SessionRow): Session => ({
  id: r.id,
  mode: r.mode,
  startedAt: r.started_at,
  endedAt: r.ended_at,
  weather: r.weather,
  toneStart: r.tone_start,
  toneEnd: r.tone_end,
  title: r.title,
});
const fromSessionPatch = (p: Partial<Session>) => {
  const row: Record<string, unknown> = {};
  if ("mode" in p) row.mode = p.mode;
  if ("startedAt" in p) row.started_at = p.startedAt;
  if ("endedAt" in p) row.ended_at = p.endedAt;
  if ("weather" in p) row.weather = p.weather;
  if ("toneStart" in p) row.tone_start = p.toneStart;
  if ("toneEnd" in p) row.tone_end = p.toneEnd;
  if ("title" in p) row.title = p.title;
  return row;
};
const toMessage = (r: MessageRow): Message => ({
  id: r.id,
  sessionId: r.session_id,
  role: r.role,
  content: r.content,
  tone: r.tone,
  riskLevel: r.risk_level,
  interrupted: r.interrupted,
  createdAt: r.created_at,
});
const toReflection = (r: ReflectionRow): Reflection => ({
  id: r.id,
  sessionId: r.session_id,
  title: r.title,
  quotes: r.quotes ?? [],
  insight: r.insight,
  nextStep: r.next_step,
  themes: r.themes ?? [],
  weather: r.weather,
  feedback: r.feedback ?? null,
  editedAt: r.edited_at ?? null,
  weatherByPerson: r.weather_by_person ?? false,
  createdAt: r.created_at,
});
const fromReflectionPatch = (p: ReflectionPatch) => {
  const row: Record<string, unknown> = {};
  if (p.title !== undefined) row.title = p.title;
  if (p.quotes !== undefined) row.quotes = p.quotes;
  if (p.insight !== undefined) row.insight = p.insight;
  if (p.nextStep !== undefined) row.next_step = p.nextStep;
  if (p.weather !== undefined) row.weather = p.weather;
  if (p.feedback !== undefined) row.feedback = p.feedback;
  if (p.editedAt !== undefined) row.edited_at = p.editedAt;
  if (p.weatherByPerson !== undefined) row.weather_by_person = p.weatherByPerson;
  return row;
};
const toMemory = (r: MemoryRow): Memory => ({
  id: r.id,
  fact: r.fact,
  category: r.category,
  sourceSessionId: r.source_session_id,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

function check<T>(result: { data: T | null; error: { message: string } | null }): T {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}

/** Account storage in Supabase. Row-Level Security limits every query to the signed-in user. */
export class SupabaseStore implements DataStore {
  readonly kind = "cloud" as const;

  constructor(
    private readonly sb: SupabaseClient,
    readonly userId: string,
  ) {}

  async getProfile(): Promise<Profile> {
    const row = check(await this.sb.from("profiles").select("*").eq("id", this.userId).maybeSingle<ProfileRow>());
    return row ? toProfile(row) : defaultProfile(this.userId);
  }

  async updateProfile(patch: Partial<Omit<Profile, "id" | "createdAt">>): Promise<Profile> {
    const row = check(await this.sb.from("profiles").update(fromProfilePatch(patch)).eq("id", this.userId).select("*").single<ProfileRow>());
    return toProfile(row);
  }

  async createSession(mode: SessionMode): Promise<Session> {
    return toSession(check(await this.sb.from("sessions").insert({ mode }).select("*").single<SessionRow>()));
  }

  async getSession(id: string): Promise<Session | null> {
    const row = check(await this.sb.from("sessions").select("*").eq("id", id).maybeSingle<SessionRow>());
    return row ? toSession(row) : null;
  }

  async updateSession(id: string, patch: Partial<Omit<Session, "id">>): Promise<Session> {
    return toSession(check(await this.sb.from("sessions").update(fromSessionPatch(patch)).eq("id", id).select("*").single<SessionRow>()));
  }

  async listSessions(limit = 100): Promise<Session[]> {
    const rows = check(await this.sb.from("sessions").select("*").order("started_at", { ascending: false }).limit(limit));
    return (rows as SessionRow[]).map(toSession);
  }

  async deleteSession(id: string, opts: { keepMemories?: boolean } = {}): Promise<void> {
    // Unlink memories first to keep them; otherwise they cascade with the session.
    if (opts.keepMemories) check(await this.sb.from("memories").update({ source_session_id: null }).eq("source_session_id", id));
    // Messages, reflection, and sourced memories cascade in the database.
    check(await this.sb.from("sessions").delete().eq("id", id));
  }

  async addMessage(m: Omit<Message, "id" | "createdAt"> & { createdAt?: string }): Promise<Message> {
    const row = check(
      await this.sb
        .from("messages")
        .insert({
          session_id: m.sessionId,
          role: m.role,
          content: m.content,
          tone: m.tone,
          risk_level: m.riskLevel,
          interrupted: m.interrupted,
          ...(m.createdAt ? { created_at: m.createdAt } : {}),
        })
        .select("*")
        .single<MessageRow>(),
    );
    return toMessage(row);
  }

  async listMessages(sessionId: string): Promise<Message[]> {
    const rows = check(await this.sb.from("messages").select("*").eq("session_id", sessionId).order("created_at"));
    return (rows as MessageRow[]).map(toMessage);
  }

  async saveReflection(r: ReflectionInput): Promise<Reflection> {
    const row = check(
      await this.sb
        .from("reflections")
        .upsert(
          { session_id: r.sessionId, title: r.title, quotes: r.quotes, insight: r.insight, next_step: r.nextStep, themes: r.themes, weather: r.weather },
          { onConflict: "session_id" },
        )
        .select("*")
        .single<ReflectionRow>(),
    );
    return toReflection(row);
  }

  async getReflection(sessionId: string): Promise<Reflection | null> {
    const row = check(await this.sb.from("reflections").select("*").eq("session_id", sessionId).maybeSingle<ReflectionRow>());
    return row ? toReflection(row) : null;
  }

  async updateReflection(sessionId: string, patch: ReflectionPatch): Promise<Reflection> {
    const row = check(
      await this.sb.from("reflections").update(fromReflectionPatch(patch)).eq("session_id", sessionId).select("*").single<ReflectionRow>(),
    );
    return toReflection(row);
  }

  async listReflections(limit = 100): Promise<Reflection[]> {
    const rows = check(await this.sb.from("reflections").select("*").order("created_at", { ascending: false }).limit(limit));
    return (rows as ReflectionRow[]).map(toReflection);
  }

  async listMemories(): Promise<Memory[]> {
    const rows = check(await this.sb.from("memories").select("*").order("updated_at", { ascending: false }));
    return (rows as MemoryRow[]).map(toMemory);
  }

  async addMemory(m: Pick<Memory, "fact" | "category" | "sourceSessionId">): Promise<Memory> {
    const row = check(
      await this.sb.from("memories").insert({ fact: m.fact, category: m.category, source_session_id: m.sourceSessionId }).select("*").single<MemoryRow>(),
    );
    return toMemory(row);
  }

  async updateMemory(id: string, patch: Partial<Pick<Memory, "fact" | "category">>): Promise<Memory> {
    const row = check(
      await this.sb.from("memories").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", id).select("*").single<MemoryRow>(),
    );
    return toMemory(row);
  }

  async deleteMemory(id: string): Promise<void> {
    check(await this.sb.from("memories").delete().eq("id", id));
  }

  async addSafetyEvent(e: Omit<SafetyEvent, "id" | "createdAt">): Promise<void> {
    check(await this.sb.from("safety_events").insert({ session_id: e.sessionId, risk_level: e.riskLevel, action_taken: e.actionTaken }));
  }

  async exportAll(): Promise<ExportBundle> {
    const sessions = await this.listSessions(10_000);
    const [messages, reflections] = await Promise.all([
      this.sb.from("messages").select("*").order("created_at").then((r) => (check(r) as MessageRow[]).map(toMessage)),
      this.listReflections(10_000),
    ]);
    return {
      exportedAt: new Date().toISOString(),
      profile: await this.getProfile(),
      sessions: sessions.map((s) => ({
        ...s,
        messages: messages.filter((m) => m.sessionId === s.id),
        reflection: reflections.find((r) => r.sessionId === s.id) ?? null,
      })),
      memories: await this.listMemories(),
    };
  }

  /** Deletes the account itself; every row cascades. */
  async deleteEverything(): Promise<void> {
    check(await this.sb.rpc("delete_my_account"));
    await this.sb.auth.signOut();
  }

  /** Copies a guest's on-device data into this account, keeping ids. */
  async importBundle(bundle: ExportBundle): Promise<void> {
    const current = await this.getProfile();
    const p = bundle.profile;
    await this.updateProfile({
      displayName: current.displayName ?? p.displayName,
      region: current.region ?? p.region,
      consentedAt: current.consentedAt ?? p.consentedAt,
      memoryEnabled: p.memoryEnabled,
      clientSummary: current.clientSummary ?? p.clientSummary,
      clientSummaryUpdatedAt: current.clientSummaryUpdatedAt ?? p.clientSummaryUpdatedAt,
    });
    for (const s of bundle.sessions) {
      check(
        await this.sb.from("sessions").upsert({
          id: s.id,
          mode: s.mode,
          started_at: s.startedAt,
          ended_at: s.endedAt,
          weather: s.weather,
          tone_start: s.toneStart,
          tone_end: s.toneEnd,
          title: s.title,
        }),
      );
      if (s.messages.length) {
        check(
          await this.sb.from("messages").upsert(
            s.messages.map((m) => ({
              id: m.id,
              session_id: s.id,
              role: m.role,
              content: m.content,
              tone: m.tone,
              risk_level: m.riskLevel,
              interrupted: m.interrupted,
              created_at: m.createdAt,
            })),
          ),
        );
      }
      if (s.reflection) {
        const r = s.reflection;
        check(
          await this.sb.from("reflections").upsert(
            {
              id: r.id,
              session_id: s.id,
              title: r.title,
              quotes: r.quotes,
              insight: r.insight,
              next_step: r.nextStep,
              themes: r.themes,
              weather: r.weather,
              feedback: r.feedback ?? null,
              edited_at: r.editedAt ?? null,
              weather_by_person: r.weatherByPerson ?? false,
              created_at: r.createdAt,
            },
            { onConflict: "session_id" },
          ),
        );
      }
    }
    if (bundle.memories.length) {
      check(
        await this.sb.from("memories").upsert(
          bundle.memories.map((m) => ({
            id: m.id,
            fact: m.fact,
            category: m.category,
            source_session_id: m.sourceSessionId,
            created_at: m.createdAt,
            updated_at: m.updatedAt,
          })),
        ),
      );
    }
  }
}
