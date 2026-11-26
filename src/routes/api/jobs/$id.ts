import { createFileRoute } from '@tanstack/react-router'
import { and, eq } from 'drizzle-orm'
import { requireUser } from '@/core/auth/session'
import { db } from '@/core/db'
import { jobs } from '@/core/db/schema'
import { toJobView } from '@/core/jobs/create'
import { handle, HttpError, json } from '@/core/server/http'
import { SITE } from '../../../../site.config.ts'

export const Route = createFileRoute('/api/jobs/$id')({
  server: {
    handlers: {
      GET: handle(async ({ request, params }: { request: Request; params: { id: string } }) => {
        if (!SITE.accounts.enabled) throw new HttpError(404, 'Not found', 'not_found')
        const user = await requireUser(request)
        const job = await db().select().from(jobs).where(and(eq(jobs.id, params.id), eq(jobs.userId, user.id))).get()
        if (!job) throw new HttpError(404, 'Job not found', 'not_found')
        return json({ job: toJobView(job) })
      }),
    },
  },
})
