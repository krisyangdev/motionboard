import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { audit, requireAdmin } from '@/core/admin/auth'
import { getAvailable, userExists } from '@/core/admin/queries'
import { adjust, getBalance } from '@/core/credits/ledger'
import { handle, HttpError, json, readJson } from '@/core/server/http'

const body = z.object({
  delta: z.number().int('Amount must be a whole number').min(-1_000_000).max(1_000_000).refine((n) => n !== 0, 'Amount cannot be 0'),
  reason: z.string().trim().min(3, 'Reason must be 3 to 200 characters').max(200, 'Reason must be 3 to 200 characters'),
})

export const Route = createFileRoute('/api/admin/users/$id/credits')({
  server: {
    handlers: {
      POST: handle(async ({ request, params }) => {
        const admin = await requireAdmin(request)
        const { delta, reason } = await readJson(request, body)
        if (!(await userExists(params.id))) throw new HttpError(404, 'User not found', 'not_found')
        if (delta < 0 && (await getAvailable(params.id)) + delta < 0) throw new HttpError(409, 'Balance cannot go below 0', 'balance_too_low')
        await adjust({ userId: params.id, delta, adminId: admin.id, reason })
        const balance = await getBalance(params.id)
        await audit(admin.id, 'credits.adjust', 'user', params.id, { delta, reason, availableAfter: balance.available })
        return json({ balance })
      }),
    },
  },
})
