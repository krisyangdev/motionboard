// Read queries behind /api/admin/*. Lists are newest first, 50 per page; `hasMore` replaces a total count.
import { desc, eq, gte, sql } from 'drizzle-orm'
import { db, schema } from '../db'

export const PAGE_SIZE = 50

const { user, creditAccounts, creditTransactions, paymentOrders, paymentWebhookEvents, jobs, adminAuditLogs, adminUsers } = schema

export const parsePage = (url: URL) => Math.max(1, Math.floor(Number(url.searchParams.get('page'))) || 1)

/** Fetches PAGE_SIZE + 1 rows to know whether another page exists. */
function paged<T>(rows: T[], page: number) {
  return { items: rows.slice(0, PAGE_SIZE), page, pageSize: PAGE_SIZE, hasMore: rows.length > PAGE_SIZE }
}
const offsetOf = (page: number) => (page - 1) * PAGE_SIZE

// ---- Dashboard ----

export async function getStats() {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const [[users], [recent], revenue, jobStatus, credit] = await Promise.all([
    db().select({ n: sql<number>`count(*)` }).from(user),
    db().select({ n: sql<number>`count(*)` }).from(user).where(gte(user.createdAt, weekAgo)),
    db()
      .select({
        mode: paymentOrders.mode,
        currency: paymentOrders.currency,
        count: sql<number>`count(*)`,
        amountMinor: sql<number>`coalesce(sum(${paymentOrders.amountMinor}), 0)`,
      })
      .from(paymentOrders)
      .where(eq(paymentOrders.status, 'paid'))
      .groupBy(paymentOrders.mode, paymentOrders.currency),
    db().select({ status: jobs.status, count: sql<number>`count(*)` }).from(jobs).groupBy(jobs.status),
    db()
      .select({
        type: creditTransactions.type,
        available: sql<number>`coalesce(sum(${creditTransactions.availableDelta}), 0)`,
        frozen: sql<number>`coalesce(sum(${creditTransactions.frozenDelta}), 0)`,
      })
      .from(creditTransactions)
      .groupBy(creditTransactions.type),
  ])
  const byType = new Map(credit.map((r) => [r.type, r]))
  return {
    users: users?.n ?? 0,
    usersLast7Days: recent?.n ?? 0,
    paidOrders: revenue,
    jobs: jobStatus,
    credits: {
      granted: byType.get('grant')?.available ?? 0,
      adjusted: byType.get('adjust')?.available ?? 0,
      // A commit releases frozen credits for good.
      spent: -(byType.get('commit')?.frozen ?? 0),
    },
  }
}

// ---- Users ----

export async function listUsers(q: string, page: number) {
  const rows = await db()
    .select({
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      available: sql<number>`coalesce(${creditAccounts.available}, 0)`,
      frozen: sql<number>`coalesce(${creditAccounts.frozen}, 0)`,
    })
    .from(user)
    .leftJoin(creditAccounts, eq(creditAccounts.userId, user.id))
    // instr avoids LIKE wildcard escaping.
    .where(q ? sql`instr(lower(${user.email}), ${q.toLowerCase()}) > 0` : undefined)
    .orderBy(desc(user.createdAt))
    .limit(PAGE_SIZE + 1)
    .offset(offsetOf(page))
  const result = paged(rows, page)
  return { ...result, items: result.items.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })) }
}

export async function getUserDetail(id: string) {
  const [row] = await db().select().from(user).where(eq(user.id, id)).limit(1)
  if (!row) return null
  const [account] = await db().select().from(creditAccounts).where(eq(creditAccounts.userId, id)).limit(1)
  const [transactions, orders, userJobs] = await Promise.all([
    db()
      .select({
        id: creditTransactions.id,
        type: creditTransactions.type,
        sourceType: creditTransactions.sourceType,
        sourceId: creditTransactions.sourceId,
        availableDelta: creditTransactions.availableDelta,
        frozenDelta: creditTransactions.frozenDelta,
        availableAfter: creditTransactions.availableAfter,
        frozenAfter: creditTransactions.frozenAfter,
        metadataJson: creditTransactions.metadataJson,
        createdAt: creditTransactions.createdAt,
      })
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, id))
      .orderBy(desc(creditTransactions.createdAt), desc(creditTransactions.id))
      .limit(PAGE_SIZE),
    db().select().from(paymentOrders).where(eq(paymentOrders.userId, id)).orderBy(desc(paymentOrders.createdAt)).limit(20),
    db()
      .select({ id: jobs.id, kind: jobs.kind, status: jobs.status, cost: jobs.cost, error: jobs.error, createdAt: jobs.createdAt })
      .from(jobs)
      .where(eq(jobs.userId, id))
      .orderBy(desc(jobs.createdAt))
      .limit(20),
  ])
  return {
    user: {
      id: row.id,
      email: row.email,
      name: row.name,
      emailVerified: row.emailVerified,
      role: row.role,
      locale: row.locale,
      dodoCustomerId: row.dodoCustomerId,
      createdAt: row.createdAt.toISOString(),
    },
    balance: { available: account?.available ?? 0, frozen: account?.frozen ?? 0 },
    transactions,
    orders: orders.map((o) => ({
      id: o.id,
      mode: o.mode,
      planCode: o.planCode,
      credits: o.credits,
      amountMinor: o.amountMinor,
      currency: o.currency,
      status: o.status,
      createdAt: o.createdAt,
    })),
    jobs: userJobs,
  }
}

export async function userExists(id: string) {
  const [row] = await db().select({ id: user.id }).from(user).where(eq(user.id, id)).limit(1)
  return !!row
}

export async function getAvailable(userId: string) {
  const [row] = await db().select({ available: creditAccounts.available }).from(creditAccounts).where(eq(creditAccounts.userId, userId)).limit(1)
  return row?.available ?? 0
}

// ---- Orders, jobs, webhooks, audit ----

export async function listOrders(page: number) {
  const rows = await db()
    .select({
      id: paymentOrders.id,
      userId: paymentOrders.userId,
      email: user.email,
      provider: paymentOrders.provider,
      mode: paymentOrders.mode,
      planCode: paymentOrders.planCode,
      credits: paymentOrders.credits,
      amountMinor: paymentOrders.amountMinor,
      currency: paymentOrders.currency,
      status: paymentOrders.status,
      providerPaymentId: paymentOrders.providerPaymentId,
      createdAt: paymentOrders.createdAt,
    })
    .from(paymentOrders)
    .leftJoin(user, eq(user.id, paymentOrders.userId))
    .orderBy(desc(paymentOrders.createdAt), desc(paymentOrders.id))
    .limit(PAGE_SIZE + 1)
    .offset(offsetOf(page))
  return paged(rows, page)
}

export async function listJobs(page: number) {
  const rows = await db()
    .select({
      id: jobs.id,
      userId: jobs.userId,
      email: user.email,
      kind: jobs.kind,
      status: jobs.status,
      cost: jobs.cost,
      attempts: jobs.attempts,
      error: jobs.error,
      reservationId: jobs.reservationId,
      createdAt: jobs.createdAt,
      updatedAt: jobs.updatedAt,
    })
    .from(jobs)
    .leftJoin(user, eq(user.id, jobs.userId))
    .orderBy(desc(jobs.createdAt), desc(jobs.id))
    .limit(PAGE_SIZE + 1)
    .offset(offsetOf(page))
  return paged(rows, page)
}

export async function listWebhooks(page: number) {
  const rows = await db()
    .select({
      id: paymentWebhookEvents.id,
      provider: paymentWebhookEvents.provider,
      providerEventId: paymentWebhookEvents.providerEventId,
      eventType: paymentWebhookEvents.eventType,
      providerPaymentId: paymentWebhookEvents.providerPaymentId,
      orderId: paymentWebhookEvents.orderId,
      status: paymentWebhookEvents.status,
      errorMessage: paymentWebhookEvents.errorMessage,
      createdAt: paymentWebhookEvents.createdAt,
    })
    .from(paymentWebhookEvents)
    .orderBy(desc(paymentWebhookEvents.createdAt), desc(paymentWebhookEvents.id))
    .limit(PAGE_SIZE + 1)
    .offset(offsetOf(page))
  return paged(rows, page)
}

export async function listAudit(page: number) {
  const rows = await db()
    .select({
      id: adminAuditLogs.id,
      actor: adminAuditLogs.actor,
      actorEmail: adminUsers.email,
      action: adminAuditLogs.action,
      targetType: adminAuditLogs.targetType,
      targetId: adminAuditLogs.targetId,
      metadataJson: adminAuditLogs.metadataJson,
      createdAt: adminAuditLogs.createdAt,
    })
    .from(adminAuditLogs)
    .leftJoin(adminUsers, eq(adminUsers.id, adminAuditLogs.actor))
    .orderBy(desc(adminAuditLogs.createdAt), desc(adminAuditLogs.id))
    .limit(PAGE_SIZE + 1)
    .offset(offsetOf(page))
  return paged(rows, page)
}
