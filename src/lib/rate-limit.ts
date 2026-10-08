import "server-only";
import { db } from "@/lib/db";
import { FEATURES } from "@/lib/features";

export type RateLimitResult = { ok: boolean; retryAfterSeconds: number };

/**
 * Fixed-window counter in Postgres, so limits hold across restarts and
 * processes. One atomic upsert per call: the window resets once it's older
 * than `windowMs`.
 */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  if (!FEATURES.rateLimiting) return { ok: true, retryAfterSeconds: 0 };
  const rows = await db.$queryRaw<{ count: number; windowStart: Date }[]>`
    INSERT INTO "RateLimit" ("key", "count", "windowStart")
    VALUES (${key}, 1, now())
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimit"."windowStart" <= now() - make_interval(secs => ${windowMs / 1000}) THEN 1
        ELSE "RateLimit"."count" + 1
      END,
      "windowStart" = CASE
        WHEN "RateLimit"."windowStart" <= now() - make_interval(secs => ${windowMs / 1000}) THEN now()
        ELSE "RateLimit"."windowStart"
      END
    RETURNING "count", "windowStart"`;
  const { count, windowStart } = rows[0];

  // Occasionally drop counters whose window ended a day ago.
  if (Math.random() < 0.01) {
    await db.rateLimit.deleteMany({ where: { windowStart: { lt: new Date(Date.now() - 86_400_000) } } });
  }

  const retryAfterSeconds = Math.max(1, Math.ceil((windowStart.getTime() + windowMs - Date.now()) / 1000));
  return { ok: count <= limit, retryAfterSeconds };
}
