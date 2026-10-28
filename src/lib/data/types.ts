import type { RiskLevel, Tone, Weather } from "@/lib/conversation/types";

export type SessionMode = "voice" | "text";

export interface Profile {
  id: string;
  displayName: string | null;
  /** Memory is on by default (docs/SPEC.md §5.1). */
  memoryEnabled: boolean;
  voiceId: string | null;
  /** ISO country code used for crisis resources, e.g. "US". */
  region: string | null;
  /** When the user accepted the consent sheet. null = not yet. */
  consentedAt: string | null;
  /** Running "case notes" summary, rewritten after each session. */
  clientSummary: string | null;
  clientSummaryUpdatedAt: string | null;
  createdAt: string;
}

export interface Session {
  id: string;
  mode: SessionMode;
  startedAt: string;
  endedAt: string | null;
  weather: Weather | null;
  toneStart: Tone | null;
  toneEnd: Tone | null;
  title: string | null;
}

export interface Message {
  id: string;
  sessionId: string;
  role: "user" | "companion";
  content: string;
  tone: Tone | null;
  riskLevel: RiskLevel | null;
  interrupted: boolean;
  createdAt: string;
}

export interface Reflection {
  id: string;
  sessionId: string;
  title: string;
  /** Things the user said that mattered, in their own words. */
  quotes: string[];
  insight: string;
  nextStep: string | null;
  themes: string[];
  weather: Weather;
  /** The person's verdict on the card: it feels right, or not quite. */
  feedback: ReflectionFeedback | null;
  /** When the person last edited the card's words. null = as written. */
  editedAt: string | null;
  /** The person chose this sky themselves. */
  weatherByPerson: boolean;
  createdAt: string;
}

export const REFLECTION_FEEDBACK = ["right", "not_quite"] as const;
export type ReflectionFeedback = (typeof REFLECTION_FEEDBACK)[number];

/** What saveReflection needs; the person's additions default to untouched. */
export type ReflectionInput = Omit<Reflection, "id" | "createdAt" | "feedback" | "editedAt" | "weatherByPerson"> &
  Partial<Pick<Reflection, "feedback" | "editedAt" | "weatherByPerson">>;

export type ReflectionPatch = Partial<
  Pick<Reflection, "title" | "quotes" | "insight" | "nextStep" | "weather" | "feedback" | "editedAt" | "weatherByPerson">
>;

/** Fills fields that older saved cards don't have. */
export function withReflectionDefaults(r: Omit<Reflection, "feedback" | "editedAt" | "weatherByPerson"> & Partial<Reflection>): Reflection {
  return { ...r, feedback: r.feedback ?? null, editedAt: r.editedAt ?? null, weatherByPerson: r.weatherByPerson ?? false };
}

export const MEMORY_CATEGORIES = ["person", "situation", "goal", "pattern", "helps", "preference", "other"] as const;
export type MemoryCategory = (typeof MEMORY_CATEGORIES)[number];

export const MEMORY_CATEGORY_LABELS: Record<MemoryCategory, string> = {
  person: "People",
  situation: "Your days",
  goal: "Hopes and goals",
  pattern: "Patterns",
  helps: "What helps",
  preference: "How you like to talk",
  other: "Other",
};

export interface Memory {
  id: string;
  fact: string;
  category: MemoryCategory;
  sourceSessionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SafetyEvent {
  id: string;
  sessionId: string;
  riskLevel: RiskLevel;
  actionTaken: string;
  createdAt: string;
}

export interface ExportBundle {
  exportedAt: string;
  profile: Profile;
  sessions: (Session & { messages: Message[]; reflection: Reflection | null })[];
  memories: Memory[];
}

/** Storage backend. LocalStore (guest, on-device) and SupabaseStore (account) both implement this. */
export interface DataStore {
  readonly kind: "local" | "cloud";

  getProfile(): Promise<Profile>;
  updateProfile(patch: Partial<Omit<Profile, "id" | "createdAt">>): Promise<Profile>;

  createSession(mode: SessionMode): Promise<Session>;
  getSession(id: string): Promise<Session | null>;
  updateSession(id: string, patch: Partial<Omit<Session, "id">>): Promise<Session>;
  /** Most recent first. */
  listSessions(limit?: number): Promise<Session[]>;
  /** Deletes the session with its messages, reflection, and memories sourced from it. */
  deleteSession(id: string): Promise<void>;

  addMessage(message: Omit<Message, "id" | "createdAt"> & { createdAt?: string }): Promise<Message>;
  listMessages(sessionId: string): Promise<Message[]>;

  saveReflection(reflection: ReflectionInput): Promise<Reflection>;
  getReflection(sessionId: string): Promise<Reflection | null>;
  /** Changes a session's reflection card (the person's edits, feedback, or sky). */
  updateReflection(sessionId: string, patch: ReflectionPatch): Promise<Reflection>;
  /** Most recent first. */
  listReflections(limit?: number): Promise<Reflection[]>;

  listMemories(): Promise<Memory[]>;
  addMemory(memory: Pick<Memory, "fact" | "category" | "sourceSessionId">): Promise<Memory>;
  updateMemory(id: string, patch: Partial<Pick<Memory, "fact" | "category">>): Promise<Memory>;
  deleteMemory(id: string): Promise<void>;

  addSafetyEvent(event: Omit<SafetyEvent, "id" | "createdAt">): Promise<void>;

  exportAll(): Promise<ExportBundle>;
  deleteEverything(): Promise<void>;
}

export function newId(): string {
  return crypto.randomUUID();
}

let lastTimestamp = 0;

/** ISO timestamp that never repeats within this tab, so records keep their insertion order. */
export function nowIso(): string {
  lastTimestamp = Math.max(Date.now(), lastTimestamp + 1);
  return new Date(lastTimestamp).toISOString();
}
