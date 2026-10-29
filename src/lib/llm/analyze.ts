import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { Analysis, ChatTurn } from "@/lib/conversation/protocol";
import { AnalysisSchema } from "@/lib/conversation/protocol";
import { ANALYSIS_SYSTEM, SESSION_START } from "@/lib/prompts/companion";
import { keywordRisk, maxRisk } from "@/lib/safety/keywords";
import { demoAnalysis } from "./demo";
import { FALLBACK_BETA, getAnthropic, MODEL } from "./client";
import { hasGemini, jsonGemini } from "./gemini";

function transcript(history: ChatTurn[]): string {
  return history
    .filter((t) => t.content !== SESSION_START)
    .slice(-8)
    .map((t) => `${t.role === "user" ? "Person" : "Companion"}: ${t.content}`)
    .join("\n");
}

/**
 * Tone, risk, and themes for the latest user turn. Runs in parallel with the reply.
 * The keyword backstop can only raise risk, never lower it.
 */
export async function analyzeLatest(history: ChatTurn[], signal?: AbortSignal): Promise<Analysis> {
  const latest = [...history].reverse().find((t) => t.role === "user")?.content ?? "";
  const backstop = keywordRisk(latest);
  const client = getAnthropic();

  const neutral: Analysis = { tone: "neutral", risk: "none", themes: [] };
  let analysis: Analysis;
  if (!client && hasGemini()) {
    try {
      analysis =
        (await jsonGemini(ANALYSIS_SYSTEM, `Recent conversation:\n${transcript(history)}\n\nLabel the person's latest message.`, AnalysisSchema, signal)) ?? neutral;
    } catch (error) {
      if (signal?.aborted) throw error;
      console.error("analysis failed", error);
      analysis = neutral;
    }
  } else if (!client) {
    analysis = demoAnalysis(latest);
  } else {
    try {
      const response = await client.beta.messages.parse(
        {
          model: MODEL,
          max_tokens: 4000,
          betas: [FALLBACK_BETA],
          fallbacks: "default",
          output_config: { effort: "low", format: betaZodOutputFormat(AnalysisSchema) },
          system: ANALYSIS_SYSTEM,
          messages: [{ role: "user", content: `Recent conversation:\n${transcript(history)}\n\nLabel the person's latest message.` }],
        },
        { signal },
      );
      analysis =
        response.stop_reason !== "refusal" && response.parsed_output
          ? response.parsed_output
          : { tone: "neutral", risk: "none", themes: [] };
    } catch (error) {
      if (signal?.aborted) throw error;
      console.error("analysis failed", error);
      analysis = { tone: "neutral", risk: "none", themes: [] };
    }
  }

  return { ...analysis, risk: maxRisk(analysis.risk, backstop), themes: analysis.themes.slice(0, 3) };
}
