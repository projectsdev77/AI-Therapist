import { z } from "zod";
import { MEMORY_CATEGORIES } from "@/lib/data/types";
import { RISK_LEVELS, TONES } from "./types";

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
      }),
    )
    .max(LIMITS.reflections),
  sessionCount: z.number().int().min(0),
  mode: z.enum(["voice", "text"]),
  localTime: z.string().max(80),
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
