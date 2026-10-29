import { z } from "zod";

/**
 * Google Gemini over plain REST, used when GEMINI_API_KEY is set and ANTHROPIC_API_KEY isn't.
 * Free-tier friendly: no SDK, JSON output is validated with the same zod schemas as Claude's.
 */

const BASE = "https://generativelanguage.googleapis.com/v1beta/models";
/** Tried in order when a model isn't available to this key or its free quota is used up. */
// (Google retired the 2.5 models for new keys; it recommends 3.5 Flash-Lite.)
const FALLBACK_MODELS = ["gemini-3.6-flash", "gemini-3.5-flash-lite"];

export const geminiModel = () => process.env.GEMINI_MODEL?.trim() || "gemini-3.8-flash";
/** The key, under the name in our docs or the names Google's own docs use. */
const geminiKey = () => (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || "").trim();
export const hasGemini = () => Boolean(geminiKey());

/** Worth trying the next model: not found, quota or rate limit, overloaded, or a model-specific 400. */
function tryNext(status: number, text: string) {
  return status === 404 || status === 429 || status === 503 || (status === 400 && /model/i.test(text) && !/API key/i.test(text));
}

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
  const models = [geminiModel(), ...FALLBACK_MODELS.filter((m) => m !== geminiModel())];
  const errors: string[] = [];
  for (const model of models) {
    const res = await fetch(`${BASE}/${model}:${method}${method === "streamGenerateContent" ? "?alt=sse" : ""}`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": geminiKey() },
      body: payload,
      signal,
    });
    if (res.ok) return res;
    const text = await res.text();
    errors.push(`Gemini ${res.status} (${model}): ${text.replace(/\s+/g, " ").slice(0, 400)}`);
    console.warn(errors.at(-1));
    if (!tryNext(res.status, text)) break;
  }
  // Every model's answer, first one first: the configured model's error is usually the real cause.
  throw new Error(errors.join(" | "));
}

/** A tiny request to see whether the key and model work. Never includes the key in the result. */
export async function checkGemini(): Promise<{ ok: boolean; model?: string; error?: string }> {
  if (!hasGemini()) return { ok: false, error: "No GEMINI_API_KEY is set on the server." };
  try {
    const res = await call("generateContent", body("Reply with the single word: ok", [{ role: "user", content: "Say ok." }]));
    const r = (await res.json()) as GeminiResponse & { modelVersion?: string };
    return { ok: true, model: r.modelVersion };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
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
  let res: Response;
  try {
    res = await call("streamGenerateContent", body(system, turns), signal);
  } catch (error) {
    if (signal?.aborted || /API key/i.test(String(error))) throw error;
    // Streaming refused: ask for the whole reply at once instead.
    console.warn("Gemini streaming failed, trying without streaming", error);
    const whole = (await (await call("generateContent", body(system, turns), signal)).json()) as GeminiResponse;
    if (blocked(whole) && !textOf(whole)) throw new GeminiBlocked();
    const text = textOf(whole);
    if (!text) throw new Error(`Gemini returned no text (finish: ${whole.candidates?.[0]?.finishReason ?? "none"})`);
    yield text;
    return;
  }
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
  if (!emitted && !signal?.aborted) throw new Error(`Gemini stream ended without text: ${buffer.slice(0, 300)}`);
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
