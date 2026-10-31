import { draftPreparation } from "@/lib/llm/prepare";
import { PrepareRequestSchema } from "@/lib/prepare/protocol";
import { clientKey, rateLimit } from "@/lib/server/rateLimit";

/** Drafts first-appointment notes from the person's own data. Nothing is stored on the server. */
export async function POST(request: Request) {
  if (!rateLimit(`prepare:${clientKey(request)}`, { capacity: 5, refillPerMinute: 2 })) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }
  const parsed = PrepareRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  try {
    return Response.json(await draftPreparation(parsed.data, request.signal));
  } catch (error) {
    console.error("prepare failed", error);
    return Response.json({ error: "Couldn't draft this right now." }, { status: 502 });
  }
}
