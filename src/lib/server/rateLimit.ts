/**
 * Best-effort in-memory rate limit per key (e.g. IP). Fine for a single instance;
 * for production behind multiple instances, swap for a shared store (see docs/DEPLOY.md).
 */
const buckets = new Map<string, { tokens: number; updated: number }>();

export function rateLimit(key: string, { capacity = 30, refillPerMinute = 20 } = {}): boolean {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { tokens: capacity, updated: now };
  const refill = ((now - bucket.updated) / 60_000) * refillPerMinute;
  bucket.tokens = Math.min(capacity, bucket.tokens + refill);
  bucket.updated = now;
  if (bucket.tokens < 1) {
    buckets.set(key, bucket);
    return false;
  }
  bucket.tokens -= 1;
  buckets.set(key, bucket);
  if (buckets.size > 10_000) buckets.clear();
  return true;
}

export function clientKey(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}
