import { NextResponse } from "next/server";

const buckets = new Map<string, number[]>();

/**
 * Minimal in-memory rate limiter (single instance).
 * Resets on restart — good enough for pilot; move to Redis for horizontal scale.
 * @returns true when the request may proceed, false when limited.
 */
export function rateLimit(key: string, max: number, windowMs = 60_000): boolean {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    buckets.set(key, hits);
    return false;
  }
  hits.push(now);
  buckets.set(key, hits);
  return true;
}

/** Stable per-client key from IP + scope. */
export function clientKey(req: Request, scope: string): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  return `${scope}:${ip}`;
}

export function limitedResponse(): NextResponse {
  return NextResponse.json(
    { error: "Too many requests. Please slow down and try again in a minute." },
    { status: 429 },
  );
}
