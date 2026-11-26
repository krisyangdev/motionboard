import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { providers } from '../../site/generation'
import { hold, refund, type Balance } from '../credits/ledger'
import { db } from '../db'
import { jobs } from '../db/schema'
import { appEnv } from '../server/env'
import { HttpError } from '../server/http'
import { createId, nowIso } from '../server/ids'
import { trackServer } from '../server/track'
import { rateLimit } from '../security/rate-limit'
import { verifyTurnstile } from '../security/turnstile'

const inputSchema = z.object({ prompt: z.string().trim().min(1, 'Prompt is required').max(1000, 'Prompt is too long (max 1000 characters)') })

export type JobView = {
  id: string
  kind: string
  status: string
  cost: number
  error: string | null
  outputUrl: string | null
  createdAt: string
}

/** The shape the API returns for a job row. */
export const toJobView = (job: typeof jobs.$inferSelect): JobView => ({
  id: job.id,
  kind: job.kind,
  status: job.status,
  cost: job.cost,
  error: job.error,
  outputUrl: job.outputKey ? `/api/files/${job.outputKey}` : null,
  createdAt: job.createdAt,
})

/** Validates, charges (hold) and queues a generation. Any failure after the hold gives the credits back. */
export async function createJob(args: {
  user: { id: string }
  kind: string
  input: unknown
  request: Request
  turnstileToken?: string
}): Promise<{ job: { id: string; status: string; cost: number }; balance: Balance }> {
  const { user, kind, request } = args
  if (!Object.hasOwn(providers, kind)) throw new HttpError(400, 'Unknown generation kind', 'unknown_kind')
  const provider = providers[kind]!
  const parsed = inputSchema.safeParse(args.input)
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message ?? 'Invalid input', 'bad_request')
  const input = parsed.data

  await verifyTurnstile(request, args.turnstileToken, 'generate')
  await rateLimit(`jobs:${user.id}`, 20, 60)

  const cost = provider.cost(input)
  const jobId = createId('job')
  const { reservationId, balance } = await hold({ userId: user.id, amount: cost, sourceType: 'job', sourceId: jobId })

  const now = nowIso()
  try {
    await db()
      .insert(jobs)
      .values({ id: jobId, userId: user.id, kind, inputJson: JSON.stringify(input), cost, status: 'queued', reservationId, createdAt: now, updatedAt: now })
  } catch (error) {
    await refund(reservationId, 'job_insert_failed')
    throw error
  }

  try {
    await appEnv().JOBS.send({ jobId })
  } catch (error) {
    console.error('Queue send failed', error)
    await db().update(jobs).set({ status: 'failed', error: 'Could not queue the job', updatedAt: nowIso() }).where(eq(jobs.id, jobId))
    await refund(reservationId, 'queue_send_failed')
    throw new HttpError(503, 'Could not queue the job, your credits were returned', 'queue_unavailable')
  }

  trackServer('generate_request', user.id, { kind, cost })
  return { job: { id: jobId, status: 'queued', cost }, balance }
}
