// Queue consumer: runs one generation per message. Credits were held when the job was created;
// success commits them, the final failed attempt refunds them. If the commit/refund itself fails,
// the job row is already final and handleCron settles the stale reservation.
import { and, eq, inArray, sql } from 'drizzle-orm'
import { providers } from '../../site/generation'
import { commit, refund } from '../credits/ledger'
import { db } from '../db'
import { jobs } from '../db/schema'
import { flag, type JobMessage } from '../server/env'
import { nowIso } from '../server/ids'
import { captureServerException, trackServer } from '../server/track'
import { putObject } from '../storage/r2'
import { mockProvider } from './mock-provider'
import type { GenerationInput } from './types'

const MAX_ATTEMPTS = 3

const errorText = (error: unknown) => (error instanceof Error ? error.message : String(error)).slice(0, 300)

export async function handleQueue(batch: MessageBatch<JobMessage>): Promise<void> {
  for (const message of batch.messages) {
    try {
      await processMessage(message)
    } catch (error) {
      // Infrastructure trouble (D1, R2): let the queue redeliver.
      console.error('Job message failed', message.body, error)
      captureServerException(error, { jobId: message.body.jobId })
      message.retry({ delaySeconds: 10 })
    }
  }
}

async function processMessage(message: Message<JobMessage>) {
  const { jobId } = message.body
  const job = await db().select().from(jobs).where(eq(jobs.id, jobId)).get()
  if (!job || (job.status !== 'queued' && job.status !== 'running')) {
    message.ack()
    return
  }

  const started = Date.now()
  await db()
    .update(jobs)
    .set({ status: 'running', attempts: sql`${jobs.attempts} + 1`, updatedAt: nowIso() })
    .where(eq(jobs.id, jobId))

  try {
    const provider = flag('MOCK_GENERATION') ? mockProvider : Object.hasOwn(providers, job.kind) ? providers[job.kind] : undefined
    if (!provider) throw new Error(`Unknown generation kind: ${job.kind}`)
    const input = JSON.parse(job.inputJson) as GenerationInput
    const result = await provider.run(input, { jobId, userId: job.userId })
    const key = `jobs/${job.userId}/${jobId}.${result.ext}`
    await putObject(key, result.body, result.contentType)
    await db()
      .update(jobs)
      .set({ status: 'succeeded', outputKey: key, outputType: result.contentType, error: null, updatedAt: nowIso() })
      .where(eq(jobs.id, jobId))
  } catch (error) {
    await onFailure(message, job, error, started)
    return
  }

  if (job.reservationId) {
    try {
      await commit(job.reservationId)
    } catch (error) {
      console.error('Commit failed, cron will settle it', jobId, error)
      captureServerException(error, { jobId })
    }
  }
  trackServer('generate_result', job.userId, { kind: job.kind, ok: true, ms: Date.now() - started })
  message.ack()
}

async function onFailure(message: Message<JobMessage>, job: typeof jobs.$inferSelect, error: unknown, started: number) {
  const text = errorText(error)
  if (message.attempts < MAX_ATTEMPTS) {
    await db().update(jobs).set({ status: 'queued', error: text, updatedAt: nowIso() }).where(and(eq(jobs.id, job.id), inArray(jobs.status, ['running'])))
    message.retry({ delaySeconds: 5 * message.attempts })
    return
  }

  await db().update(jobs).set({ status: 'failed', error: text, updatedAt: nowIso() }).where(eq(jobs.id, job.id))
  if (job.reservationId) {
    try {
      await refund(job.reservationId, 'job_failed')
    } catch (refundError) {
      console.error('Refund failed, cron will settle it', job.id, refundError)
      captureServerException(refundError, { jobId: job.id })
    }
  }
  trackServer('generate_result', job.userId, { kind: job.kind, ok: false, ms: Date.now() - started })
  message.ack()
}
