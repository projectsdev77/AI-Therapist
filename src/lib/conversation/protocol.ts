import { z } from "zod";
import { MEMORY_CATEGORIES } from "@/lib/data/types";
import { RISK_LEVELS, SUPPORT_STYLES, TONES } from "./types";

/** Limits keep requests (and cost) bounded. */
export const LIMITS = {
  messageChars: 4000,
  historyTurns: 60,
  memories: 80,
  reflections: 3,
} as const;

export const ChatTurnSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(LIMITS.messageChars),
});
export type ChatTurn = z.infer<typeof ChatTurnSchema>;

/** What the companion knows about the person, assembled on the client from their own data. */
export const CompanionContextSchema = z.object({
  displayName: z.string().max(80).nullable(),
  memoryEnabled: z.boolean(),
  clientSummary: z.string().max(4000).nullable(),
  memories: z
    .array(z.object({ fact: z.string().max(400), category: z.enum(MEMORY_CATEGORIES) }))
    .max(LIMITS.memories),
  recentReflections: z
    .array(
      z.object({
        date: z.string().max(40),
        title: z.string().max(200),
        insight: z.string().max(600),
        nextStep: z.string().max(300).nullable(),
        /** The person said this card wasn't quite right. */
        notQuite: z.boolean().optional(),
      }),
    )
    .max(LIMITS.reflections),
  sessionCount: z.number().int().min(0),
  mode: z.enum(["voice", "text"]),
  localTime: z.string().max(80),
  /** The kind of support the person chose for this conversation, if any. */
  supportStyle: z.enum(SUPPORT_STYLES).nullable().optional(),
  /** How the last conversation ended: the step they agreed to, and whether they felt heard. */
  lastConversation: z
    .object({ date: z.string().max(40), openStep: z.string().max(300).nullable(), heard: z.enum(["yes", "somewhat", "no"]).nullable() })
    .nullable()
    .optional(),
  /** A safety moment in the last two weeks, so Haven can gently check in. */
  recentSafety: z.object({ date: z.string().max(40), level: z.enum(["elevated", "acute"]) }).nullable().optional(),
  /** They have a personal safety plan in the app. */
  hasSafetyPlan: z.boolean().optional(),
  /** Their own 0–10 mood rating at the start of this conversation. */
  moodNow: z.number().int().min(0).max(10).nullable().optional(),
  /** Minutes since their previous conversation, so a quick return gets a light hello. */
  lastTalkedMinutesAgo: z.number().int().min(0).optional(),
  /** Minutes since this conversation started, for gentle time cues. */
  minutesIn: z.number().int().min(0).max(1440).optional(),
});
export type CompanionContext = z.infer<typeof CompanionContextSchema>;

export const ConverseRequestSchema = z.object({
  /** Conversation so far, oldest first. Empty for the opening line. */
  history: z.array(ChatTurnSchema).max(LIMITS.historyTurns),
  context: CompanionContextSchema,
});
export type ConverseRequest = z.infer<typeof ConverseRequestSchema>;

// Output schemas avoid length constraints (structured outputs support a subset of
// JSON Schema); limits are applied after parsing instead.
export const AnalysisSchema = z.object({
  tone: z.enum(TONES),
  risk: z.enum(RISK_LEVELS),
  themes: z.array(z.string()),
});
export type Analysis = z.infer<typeof AnalysisSchema>;

/** Newline-delimited JSON events streamed back from /api/converse. */
export type ConverseEvent =
  | { type: "analysis"; analysis: Analysis }
  | { type: "delta"; text: string }
  | { type: "done"; demo: boolean }
  | { type: "error"; message: string };
