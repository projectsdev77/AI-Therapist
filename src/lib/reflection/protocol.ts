import { z } from "zod";
import { isUsableTheme } from "@/lib/patterns/tags";
import { ChatTurnSchema, LIMITS } from "@/lib/conversation/protocol";
import { MEMORY_CATEGORIES } from "@/lib/data/types";

export const ReflectRequestSchema = z.object({
  transcript: z.array(ChatTurnSchema).min(1).max(LIMITS.historyTurns),
  memoryEnabled: z.boolean(),
  displayName: z.string().max(80).nullable(),
  clientSummary: z.string().max(4000).nullable(),
  memories: z
    .array(z.object({ id: z.string().max(64), fact: z.string().max(400), category: z.enum(MEMORY_CATEGORIES) }))
    .max(LIMITS.memories),
  knownThemes: z.array(z.string().max(40)).max(60),
  /** The person said the card wasn't quite right: rewrite it to fit what they said (no memory changes). */
  correction: z
    .object({
      note: z.string().max(600),
      card: z.object({ title: z.string().max(200), quotes: z.array(z.string().max(400)).max(3), insight: z.string().max(600), nextStep: z.string().max(300).nullable() }),
    })
    .optional(),
});
export type ReflectRequest = z.infer<typeof ReflectRequestSchema>;

/** Structured output from the end-of-session pass. No length constraints here; see normalize(). */
export const ReflectOutputSchema = z.object({
  reflection: z.object({
    title: z.string(),
    quotes: z.array(z.string()),
    insight: z.string(),
    nextStep: z.string().nullable(),
    themes: z.array(z.string()),
  }),
  memory: z.object({
    add: z.array(z.object({ fact: z.string(), category: z.enum(MEMORY_CATEGORIES) })),
    update: z.array(z.object({ id: z.string(), fact: z.string() })),
    remove: z.array(z.string()),
  }),
  clientSummary: z.string().nullable(),
});
export type ReflectOutput = z.infer<typeof ReflectOutputSchema>;

const clip = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);

/** Applies limits and cleans model output before it touches storage. */
export function normalizeReflectOutput(out: ReflectOutput, req: ReflectRequest): ReflectOutput {
  const knownIds = new Set(req.memories.map((m) => m.id));
  const memory = req.memoryEnabled
    ? {
        add: out.memory.add.filter((m) => m.fact.trim()).slice(0, 8).map((m) => ({ ...m, fact: clip(m.fact.trim(), 300) })),
        update: out.memory.update.filter((u) => knownIds.has(u.id) && u.fact.trim()).slice(0, 12).map((u) => ({ ...u, fact: clip(u.fact.trim(), 300) })),
        remove: out.memory.remove.filter((id) => knownIds.has(id)).slice(0, 12),
      }
    : { add: [], update: [], remove: [] };
  return {
    reflection: {
      title: clip(out.reflection.title.trim() || "A conversation", 80),
      quotes: out.reflection.quotes.map((q) => clip(q.trim().replace(/^["“]|["”]$/g, ""), 200)).filter(Boolean).slice(0, 3),
      insight: clip(out.reflection.insight.trim(), 400),
      nextStep: out.reflection.nextStep?.trim() ? clip(out.reflection.nextStep.trim(), 160) : null,
      themes: [...new Set(out.reflection.themes.map((t) => t.trim().toLowerCase()).filter(isUsableTheme))].slice(0, 3),
    },
    memory,
    clientSummary: req.memoryEnabled && out.clientSummary?.trim() ? clip(out.clientSummary.trim(), 1200) : null,
  };
}
