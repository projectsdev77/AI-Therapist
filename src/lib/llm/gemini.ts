import { z } from "zod";

/**
 * Google Gemini over plain REST, used when GEMINI_API_KEY is set and ANTHROPIC_API_KEY isn't.
 * Free-tier friendly: no SDK, JSON output is validated with the same zod schemas as Claude's.
 */

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";
/** Used when the configured model isn't available to this key. */
const FALLBACK_MODEL = "gemini-2.5-flash";

export const geminiModel = () => process.env.GEMINI_MODEL || "gemini-3.8-flash";
export const hasGemini = () => Boolean(process.env.GEMINI_API_KEY);

// A support companion has to be able to hear about self-harm and abuse; the app's own
// safety layer (analysis + keyword backstop) handles risk, so only block the most severe content.
const SAFETY = ["HARM_CATEGORY_HATE_SPEECH", "HARM_CATEGORY_SEXUALLY_EXPLICIT", "HARM_CATEGORY_DANGEROUS_CONTENT", "HARM_CATEGORY_HARASSMENT"].map(
  (category) => ({ category, threshold: "BLOCK_ONLY_HIGH" }),
);

export interface GeminiTurn {
  role: "user" | "assistant";
  content: string;
}

interface Candidate {
  content?: { parts?: { text?: string; thought?: boolean }[] };
  finishReason?: string;
}
interface GeminiResponse {
  candidates?: Candidate[];
  promptFeedback?: { blockReason?: string };
}

/** Thrown when Gemini blocks the prompt or the reply for safety. */
export class GeminiBlocked extends Error {}

function body(system: string, turns: GeminiTurn[], json = false) {
  return JSON.stringify({
    systemInstruction: { parts: [{ text: system }] },
    contents: turns.map((t) => ({ role: t.role === "assistant" ? "model" : "user", parts: [{ text: t.content }] })),
    safetySettings: SAFETY,
    ...(json ? { generationConfig: { responseMimeType: "application/json" } } : {}),
  });
}

async function call(method: "generateContent" | "streamGenerateContent", payload: string, signal?: AbortSignal): Promise<Response> {
  const go = (model: string) =>
    fetch(`${BASE}/${model}:${method}${method === "streamGenerateContent" ? "?alt=sse" : ""}`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY ?? "" },
      body: payload,
      signal,
    });
  let res = await go(geminiModel());
  if (res.status === 404 && geminiModel() !== FALLBACK_MODEL) res = await go(FALLBACK_MODEL);
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res;
}

const textOf = (r: GeminiResponse) =>
  (r.candidates?.[0]?.content?.parts ?? [])
    .filter((p) => !p.thought)
    .map((p) => p.text ?? "")
    .join("");

const blocked = (r: GeminiResponse) =>
  Boolean(r.promptFeedback?.blockReason) || ["SAFETY", "PROHIBITED_CONTENT", "BLOCKLIST", "SPII"].includes(r.candidates?.[0]?.finishReason ?? "");

/** Streams reply text. Throws GeminiBlocked if nothing was said before a safety block. */
export async function* streamGemini(system: string, turns: GeminiTurn[], signal?: AbortSignal): AsyncGenerator<string> {
  const res = await call("streamGenerateContent", body(system, turns), signal);
  const reader = res.body!.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  let emitted = false;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += value;
    const events = buffer.split(/\r?\n\r?\n/);
    buffer = events.pop() ?? "";
    for (const event of events) {
      const data = event
        .split(/\r?\n/)
        .filter((l) => l.startsWith("data:"))
        .map((l) => l.slice(5).trim())
        .join("");
      if (!data) continue;
      const chunk = JSON.parse(data) as GeminiResponse;
      const text = textOf(chunk);
      if (text) {
        emitted = true;
        yield text;
      }
      if (blocked(chunk) && !emitted) throw new GeminiBlocked();
    }
  }
}

/**
 * One JSON answer validated against `schema`. The schema is described in the prompt
 * (Gemini's JSON mode guarantees JSON, not the shape). Returns null if it doesn't fit.
 */
export async function jsonGemini<T>(system: string, user: string, schema: z.ZodType<T>, signal?: AbortSignal): Promise<T | null> {
  const shape = JSON.stringify(z.toJSONSchema(schema));
  const instructions = `${system}\n\nAnswer with one JSON object only, matching this JSON Schema exactly:\n${shape}`;
  const res = await call("generateContent", body(instructions, [{ role: "user", content: user }], true), signal);
  const r = (await res.json()) as GeminiResponse;
  if (blocked(r)) return null;
  const raw = textOf(r).replace(/^```(?:json)?\s*|\s*```$/g, "");
  try {
    const parsed = schema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
