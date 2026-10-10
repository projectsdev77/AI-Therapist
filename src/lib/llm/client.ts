import Anthropic from "@anthropic-ai/sdk";

/** Conversation and analysis model (docs/SPEC.md §6). */
export const MODEL = "claude-opus-5-5";

/** Server-side refusal fallback: Anthropic picks the substitute model by refusal category. */
export const FALLBACK_BETA = "server-side-fallback-2026-07-01" as const;

let client: Anthropic | null | undefined;

/** null when no API key is configured — callers fall back to demo mode. */
export function getAnthropic(): Anthropic | null {
  if (client !== undefined) return client;
  client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null;
  return client;
}
