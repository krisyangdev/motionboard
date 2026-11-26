import { sql } from 'drizzle-orm'
import { db } from '../db'
import { rateLimits } from '../db/schema'
import { HttpError } from '../server/http'
import { nowIso } from '../server/ids'

/**
 * Fixed-window counter on D1: at most `limit` calls per `windowSeconds` for `key`. One atomic
 * upsert both opens a new window (when the old one is over) and counts the call.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number): Promise<void> {
  const now = Date.now()
  const resetAt = now + windowSeconds * 1000
  const expired = sql`${rateLimits.resetAt} <= ${now}`
  const row = await db()
    .insert(rateLimits)
    .values({ key, count: 1, resetAt, updatedAt: nowIso() })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: {
        count: sql`case when ${expired} then 1 else ${rateLimits.count} + 1 end`,
        resetAt: sql`case when ${expired} then ${resetAt} else ${rateLimits.resetAt} end`,
        updatedAt: nowIso(),
      },
    })
    .returning({ count: rateLimits.count })
    .get()
  if (!row || row.count > limit) throw new HttpError(429, 'Too many requests, try again later', 'rate_limited')
}
