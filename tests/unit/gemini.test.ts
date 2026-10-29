import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { z } from "zod";
import { GeminiBlocked, jsonGemini, streamGemini } from "@/lib/llm/gemini";

const sse = (chunks: object[]) =>
  new Response(chunks.map((c) => `data: ${JSON.stringify(c)}\r\n\r\n`).join(""), { headers: { "content-type": "text/event-stream" } });
const say = (text: string, finishReason?: string) => ({ candidates: [{ content: { parts: [{ text }] }, finishReason }] });

beforeEach(() => vi.stubEnv("GEMINI_API_KEY", "test-key"));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

async function collect(gen: AsyncGenerator<string>) {
  let out = "";
  for await (const t of gen) out += t;
  return out;
}

test("streams reply text and sends history with Gemini's roles", async () => {
  const fetchMock = vi.fn().mockResolvedValue(sse([say("Hello "), say("there.", "STOP")]));
  vi.stubGlobal("fetch", fetchMock);
  const text = await collect(streamGemini("be kind", [{ role: "user", content: "hi" }, { role: "assistant", content: "hey" }, { role: "user", content: "ok" }]));
  expect(text).toBe("Hello there.");
  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toContain(":streamGenerateContent?alt=sse");
  expect(init.headers["x-goog-api-key"]).toBe("test-key");
  const body = JSON.parse(init.body);
  expect(body.contents.map((c: { role: string }) => c.role)).toEqual(["user", "model", "user"]);
  expect(body.systemInstruction.parts[0].text).toBe("be kind");
});

test("a safety block before any words throws GeminiBlocked", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(sse([{ promptFeedback: { blockReason: "SAFETY" } }])));
  await expect(collect(streamGemini("s", [{ role: "user", content: "x" }]))).rejects.toBeInstanceOf(GeminiBlocked);
});

test("falls back to gemini-3.6-flash when the configured model is missing", async () => {
  const fetchMock = vi.fn().mockResolvedValueOnce(new Response("not found", { status: 404 })).mockResolvedValueOnce(sse([say("ok")]));
  vi.stubGlobal("fetch", fetchMock);
  expect(await collect(streamGemini("s", [{ role: "user", content: "x" }]))).toBe("ok");
  expect(fetchMock.mock.calls[1][0]).toContain("/gemini-3.6-flash:");
});

test("JSON answers are validated against the schema", async () => {
  const schema = z.object({ tone: z.string() });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(say('```json\n{"tone":"calm"}\n```'))));
  expect(await jsonGemini("s", "u", schema)).toEqual({ tone: "calm" });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(say('{"mood":1}'))));
  expect(await jsonGemini("s", "u", schema)).toBeNull();
});

test("moves on to the next model when the free quota is used up", async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(new Response("quota", { status: 429 }))
    .mockResolvedValueOnce(new Response("quota", { status: 429 }))
    .mockResolvedValueOnce(sse([say("ok")]));
  vi.stubGlobal("fetch", fetchMock);
  expect(await collect(streamGemini("s", [{ role: "user", content: "x" }]))).toBe("ok");
  expect(fetchMock.mock.calls[2][0]).toContain("/gemini-3.5-flash-lite:");
});

test("a bad key fails at once with Google's message", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response('{"error":{"message":"API key not valid."}}', { status: 400 }));
  vi.stubGlobal("fetch", fetchMock);
  await expect(collect(streamGemini("s", [{ role: "user", content: "x" }]))).rejects.toThrow(/API key not valid/);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
