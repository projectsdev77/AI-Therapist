import { reflectOnSession } from "@/lib/llm/reflect";
import { ReflectRequestSchema } from "@/lib/reflection/protocol";
import { clientKey, rateLimit } from "@/lib/server/rateLimit";

export async function POST(request: Request) {
  if (!rateLimit(`reflect:${clientKey(request)}`, { capacity: 10, refillPerMinute: 4 })) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }
  const parsed = ReflectRequestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid request" }, { status: 400 });
  try {
    return Response.json(await reflectOnSession(parsed.data, request.signal));
  } catch (error) {
    console.error("reflect failed", error);
    return Response.json({ error: "Couldn't make a reflection right now." }, { status: 502 });
  }
}
