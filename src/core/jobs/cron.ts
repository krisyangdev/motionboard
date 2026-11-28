// Scheduled cleanup (every 10 minutes): settle stale credit holds and delete expired rows and old mock emails.
// Every query here uses an index (schema.ts) and writes only rows that change.
import { and, eq, lt } from 'drizzle-orm'
import { commit, refund } from '../credits/ledger'
import { db } from '../db'
import { pruneMockEmails } from '../email/send'
import { adminSessions, creditReservations, jobs, rateLimits } from '../db/schema'
import { nowIso } from '../server/ids'
import { captureServerException } from '../server/track'

const STALE_MS = 30 * 60 * 1000

export async function handleCron(): Promise<void> {
  const cutoff = new Date(Date.now() - STALE_MS).toISOString()
  let refunded = 0
  let committed = 0
  let timedOut = 0

  const stale = await db()
    .select()
    .from(creditReservations)
    .where(and(eq(creditReservations.status, 'held'), lt(creditReservations.createdAt, cutoff)))
    .limit(200)

  for (const reservation of stale) {
    try {
      const job = await db().select().from(jobs).where(eq(jobs.reservationId, reservation.id)).get()
      const active = job?.status === 'queued' || job?.status === 'running'
      if (job && active && job.updatedAt >= cutoff) continue // still making progress
      if (job?.status === 'succeeded') {
        // Result was delivered but the commit was lost.
        await commit(reservation.id)
        committed++
        continue
      }
      if (job && active) {
        await db().update(jobs).set({ status: 'failed', error: 'timed out', updatedAt: nowIso() }).where(eq(jobs.id, job.id))
        timedOut++
      }
      await refund(reservation.id, 'timed_out')
      refunded++
    } catch (error) {
      console.error('Cron could not settle reservation', reservation.id, error)
      captureServerException(error, { reservationId: reservation.id })
    }
  }

  const limits = await db().delete(rateLimits).where(lt(rateLimits.resetAt, Date.now())).run()
  const sessions = await db().delete(adminSessions).where(lt(adminSessions.expiresAt, nowIso())).run()
  const mockEmails = await pruneMockEmails()

  console.log(
    `cron: refunded ${refunded}, committed ${committed}, timed out ${timedOut}, rate limits deleted ${limits.meta.changes}, admin sessions deleted ${sessions.meta.changes}, mock emails deleted ${mockEmails}`,
  )
}
