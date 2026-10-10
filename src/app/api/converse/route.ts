import { ConverseRequestSchema, type ConverseEvent } from "@/lib/conversation/protocol";
import { analyzeLatest } from "@/lib/llm/analyze";
import { isDemoMode, streamReply } from "@/lib/llm/converse";
import { clientKey, rateLimit } from "@/lib/server/rateLimit";

export async function POST(request: Request) {
  if (!rateLimit(`converse:${clientKey(request)}`)) {
    return Response.json({ error: "Too many messages. Take a breath and try again in a minute." }, { status: 429 });
  }

  const parsed = ConverseRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  const { history, context } = parsed.data;
  const hasUserTurn = history.some((t) => t.role === "user");

  const encoder = new TextEncoder();
  const abort = new AbortController();
  request.signal.addEventListener("abort", () => abort.abort());

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ConverseEvent) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
        } catch {
          // Client went away.
        }
      };

      // Analysis runs alongside the reply so tone and safety UI can react early.
      const analysis = hasUserTurn
        ? analyzeLatest(history, abort.signal).then(
            (a) => send({ type: "analysis", analysis: a }),
            () => undefined,
          )
        : Promise.resolve();

      try {
        for await (const text of streamReply(history, context, abort.signal)) send({ type: "delta", text });
        await analysis;
        send({ type: "done", demo: isDemoMode() });
      } catch (error) {
        if (!abort.signal.aborted) {
          console.error("converse failed", error);
          send({ type: "error", message: "I lost my train of thought for a moment. Could you say that again?" });
        }
      } finally {
        try {
          controller.close();
        } catch {
          // Already closed.
        }
      }
    },
    cancel() {
      abort.abort();
    },
  });

  return new Response(body, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}
