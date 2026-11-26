import { createFileRoute } from '@tanstack/react-router'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { requireUser } from '@/core/auth/session'
import { db } from '@/core/db'
import { jobs } from '@/core/db/schema'
import { createJob, toJobView } from '@/core/jobs/create'
import { handle, HttpError, json, readJson } from '@/core/server/http'
import { SITE } from '../../../../site.config.ts'

const createSchema = z.object({
  kind: z.string().min(1),
  input: z.unknown(),
  turnstileToken: z.string().optional(),
})

export const Route = createFileRoute('/api/jobs/')({
  server: {
    handlers: {
      GET: handle(async ({ request }: { request: Request }) => {
        if (!SITE.accounts.enabled) throw new HttpError(404, 'Not found', 'not_found')
        const user = await requireUser(request)
        const rows = await db().select().from(jobs).where(eq(jobs.userId, user.id)).orderBy(desc(jobs.createdAt)).limit(20)
        return json({ items: rows.map(toJobView) })
      }),
      POST: handle(async ({ request }: { request: Request }) => {
        if (!SITE.accounts.enabled) throw new HttpError(404, 'Not found', 'not_found')
        const user = await requireUser(request)
        const body = await readJson(request, createSchema)
        return json(await createJob({ user, kind: body.kind, input: body.input, request, turnstileToken: body.turnstileToken }))
      }),
    },
  },
})
