import type { BetaMessageParam } from "@anthropic-ai/sdk/resources/beta/messages/messages";
import type { ChatTurn, CompanionContext } from "@/lib/conversation/protocol";
import { buildContextBlock, COMPANION_SYSTEM, SESSION_START } from "@/lib/prompts/companion";
import { FALLBACK_BETA, getAnthropic, MODEL } from "./client";
import { demoReply, streamText } from "./demo";
import { GeminiBlocked, hasGemini, streamGemini } from "./gemini";

const REFUSAL_REPLY =
  "I'm not able to go into that, but I'm still here with you. Would you like to tell me more about how you're feeling?";

/** The conversation always starts with the session marker so the first turn is a user turn. */
export function toApiMessages(history: ChatTurn[]): BetaMessageParam[] {
  const turns = history[0]?.content === SESSION_START ? history : [{ role: "user" as const, content: SESSION_START }, ...history];
  return turns.map((t) => ({ role: t.role, content: t.content }));
}

/** Streams the companion's reply as text chunks. Falls back to demo mode without an API key. */
export async function* streamReply(history: ChatTurn[], ctx: CompanionContext, signal?: AbortSignal): AsyncGenerator<string> {
  const client = getAnthropic();
  if (!client && hasGemini()) {
    try {
      yield* streamGemini(`${COMPANION_SYSTEM}\n\n${buildContextBlock(ctx)}`, toApiMessages(history) as { role: "user" | "assistant"; content: string }[], signal);
    } catch (error) {
      if (!(error instanceof GeminiBlocked)) throw error;
      yield REFUSAL_REPLY;
    }
    return;
  }
  if (!client) {
    yield* streamText(demoReply(history, ctx), signal);
    return;
  }

  const stream = client.beta.messages.stream(
    {
      model: MODEL,
      max_tokens: 8000,
      betas: [FALLBACK_BETA],
      fallbacks: "default",
      // Low effort keeps time-to-first-word short for voice. Tune against evals/.
      output_config: { effort: "low" },
      cache_control: { type: "ephemeral" },
      system: [
        { type: "text", text: COMPANION_SYSTEM, cache_control: { type: "ephemeral" } },
        { type: "text", text: buildContextBlock(ctx) },
      ],
      messages: toApiMessages(history),
    },
    { signal },
  );

  let emitted = false;
  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      emitted = true;
      yield event.delta.text;
    }
  }
  const final = await stream.finalMessage();
  if (final.stop_reason === "refusal" && !emitted) yield REFUSAL_REPLY;
}

export const isDemoMode = () => getAnthropic() === null && !hasGemini();
