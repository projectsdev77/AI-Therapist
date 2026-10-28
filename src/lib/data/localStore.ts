import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { defaultProfile } from "./defaults";
import {
  newId,
  nowIso,
  type DataStore,
  type ExportBundle,
  type Memory,
  type Message,
  type Profile,
  type Reflection,
  type ReflectionInput,
  type ReflectionPatch,
  withReflectionDefaults,
  type SafetyEvent,
  type Session,
  type SessionMode,
} from "./types";

interface HavenDB extends DBSchema {
  profile: { key: string; value: Profile };
  sessions: { key: string; value: Session; indexes: { byStartedAt: string } };
  messages: { key: string; value: Message; indexes: { bySession: string } };
  reflections: { key: string; value: Reflection; indexes: { bySession: string; byCreatedAt: string } };
  memories: { key: string; value: Memory; indexes: { bySource: string } };
  safetyEvents: { key: string; value: SafetyEvent };
}

const PROFILE_KEY = "me";

/** Guest storage: everything stays in this browser (IndexedDB). */
export class LocalStore implements DataStore {
  readonly kind = "local" as const;
  private db: Promise<IDBPDatabase<HavenDB>> | null = null;

  constructor(private readonly name = "haven") {}

  /** Opened lazily so constructing the store during server rendering is safe. */
  private get dbPromise(): Promise<IDBPDatabase<HavenDB>> {
    this.db ??= openDB<HavenDB>(this.name, 1, {
      upgrade(db) {
        db.createObjectStore("profile");
        db.createObjectStore("sessions", { keyPath: "id" }).createIndex("byStartedAt", "startedAt");
        db.createObjectStore("messages", { keyPath: "id" }).createIndex("bySession", "sessionId");
        const reflections = db.createObjectStore("reflections", { keyPath: "id" });
        reflections.createIndex("bySession", "sessionId", { unique: true });
        reflections.createIndex("byCreatedAt", "createdAt");
        db.createObjectStore("memories", { keyPath: "id" }).createIndex("bySource", "sourceSessionId");
        db.createObjectStore("safetyEvents", { keyPath: "id" });
      },
    });
    return this.db;
  }

  async getProfile(): Promise<Profile> {
    const db = await this.dbPromise;
    const existing = await db.get("profile", PROFILE_KEY);
    if (existing) return existing;
    const created = defaultProfile();
    await db.put("profile", created, PROFILE_KEY);
    return created;
  }

  async updateProfile(patch: Partial<Omit<Profile, "id" | "createdAt">>): Promise<Profile> {
    const db = await this.dbPromise;
    const next = { ...(await this.getProfile()), ...patch };
    await db.put("profile", next, PROFILE_KEY);
    return next;
  }

  async createSession(mode: SessionMode): Promise<Session> {
    const session: Session = {
      id: newId(),
      mode,
      startedAt: nowIso(),
      endedAt: null,
      weather: null,
      toneStart: null,
      toneEnd: null,
      title: null,
    };
    await (await this.dbPromise).put("sessions", session);
    return session;
  }

  async getSession(id: string): Promise<Session | null> {
    return (await (await this.dbPromise).get("sessions", id)) ?? null;
  }

  async updateSession(id: string, patch: Partial<Omit<Session, "id">>): Promise<Session> {
    const db = await this.dbPromise;
    const current = await db.get("sessions", id);
    if (!current) throw new Error(`Session ${id} not found`);
    const next = { ...current, ...patch };
    await db.put("sessions", next);
    return next;
  }

  async listSessions(limit = 100): Promise<Session[]> {
    const db = await this.dbPromise;
    const all = await db.getAllFromIndex("sessions", "byStartedAt");
    return all.reverse().slice(0, limit);
  }

  async deleteSession(id: string, opts: { keepMemories?: boolean } = {}): Promise<void> {
    const db = await this.dbPromise;
    const tx = db.transaction(["sessions", "messages", "reflections", "memories"], "readwrite");
    await tx.objectStore("sessions").delete(id);
    for (const key of await tx.objectStore("messages").index("bySession").getAllKeys(id)) {
      await tx.objectStore("messages").delete(key);
    }
    for (const key of await tx.objectStore("reflections").index("bySession").getAllKeys(id)) {
      await tx.objectStore("reflections").delete(key);
    }
    const memories = tx.objectStore("memories");
    for (const memory of await memories.index("bySource").getAll(id)) {
      if (opts.keepMemories) await memories.put({ ...memory, sourceSessionId: null });
      else await memories.delete(memory.id);
    }
    await tx.done;
  }

  async addMessage(input: Omit<Message, "id" | "createdAt"> & { createdAt?: string }): Promise<Message> {
    const message: Message = { ...input, id: newId(), createdAt: input.createdAt ?? nowIso() };
    await (await this.dbPromise).put("messages", message);
    return message;
  }

  async listMessages(sessionId: string): Promise<Message[]> {
    const all = await (await this.dbPromise).getAllFromIndex("messages", "bySession", sessionId);
    return all.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async saveReflection(input: ReflectionInput): Promise<Reflection> {
    const db = await this.dbPromise;
    const existing = await db.getFromIndex("reflections", "bySession", input.sessionId);
    const reflection = withReflectionDefaults({
      ...input,
      id: existing?.id ?? newId(),
      createdAt: existing?.createdAt ?? nowIso(),
    });
    await db.put("reflections", reflection);
    return reflection;
  }

  async getReflection(sessionId: string): Promise<Reflection | null> {
    const r = await (await this.dbPromise).getFromIndex("reflections", "bySession", sessionId);
    return r ? withReflectionDefaults(r) : null;
  }

  async updateReflection(sessionId: string, patch: ReflectionPatch): Promise<Reflection> {
    const db = await this.dbPromise;
    const current = await db.getFromIndex("reflections", "bySession", sessionId);
    if (!current) throw new Error(`Reflection for ${sessionId} not found`);
    const next = withReflectionDefaults({ ...current, ...patch });
    await db.put("reflections", next);
    return next;
  }

  async listReflections(limit = 100): Promise<Reflection[]> {
    const all = await (await this.dbPromise).getAllFromIndex("reflections", "byCreatedAt");
    return all.reverse().slice(0, limit).map(withReflectionDefaults);
  }

  async listMemories(): Promise<Memory[]> {
    const all = await (await this.dbPromise).getAll("memories");
    return all.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async addMemory(input: Pick<Memory, "fact" | "category" | "sourceSessionId">): Promise<Memory> {
    const now = nowIso();
    const memory: Memory = { ...input, id: newId(), createdAt: now, updatedAt: now };
    await (await this.dbPromise).put("memories", memory);
    return memory;
  }

  async updateMemory(id: string, patch: Partial<Pick<Memory, "fact" | "category">>): Promise<Memory> {
    const db = await this.dbPromise;
    const current = await db.get("memories", id);
    if (!current) throw new Error(`Memory ${id} not found`);
    const next = { ...current, ...patch, updatedAt: nowIso() };
    await db.put("memories", next);
    return next;
  }

  async deleteMemory(id: string): Promise<void> {
    await (await this.dbPromise).delete("memories", id);
  }

  async addSafetyEvent(input: Omit<SafetyEvent, "id" | "createdAt">): Promise<void> {
    await (await this.dbPromise).put("safetyEvents", { ...input, id: newId(), createdAt: nowIso() });
  }

  async exportAll(): Promise<ExportBundle> {
    const sessions = await this.listSessions(Number.MAX_SAFE_INTEGER);
    return {
      exportedAt: nowIso(),
      profile: await this.getProfile(),
      sessions: await Promise.all(
        sessions.map(async (s) => ({
          ...s,
          messages: await this.listMessages(s.id),
          reflection: await this.getReflection(s.id),
        })),
      ),
      memories: await this.listMemories(),
    };
  }

  async deleteEverything(): Promise<void> {
    const db = await this.dbPromise;
    const stores = ["profile", "sessions", "messages", "reflections", "memories", "safetyEvents"] as const;
    const tx = db.transaction([...stores], "readwrite");
    await Promise.all(stores.map((s) => tx.objectStore(s).clear()));
    await tx.done;
  }
}
