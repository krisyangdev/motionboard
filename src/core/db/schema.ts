// D1 schema (Drizzle, SQLite). Change it here, then `npm run db:generate` writes the SQL migration
// into migrations/; apply with `npm run db:migrate:local` / `db:migrate:remote`.
// Better Auth tables (user, session, account, verification) follow Better Auth 1.7's core schema;
// its timestamps are Date (integer ms). Our own tables store ISO text timestamps.
import { sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

const authTime = (name: string) => integer(name, { mode: 'timestamp_ms' })
const createdAt = () => text('created_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`)
const updatedAt = () => text('updated_at').notNull().default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ','now'))`)

// ---- Better Auth ----

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  image: text('image'),
  /** 'user' | 'admin'; site admins use the separate admin_users identity, this is for app-level roles. */
  role: text('role').notNull().default('user'),
  /** Set by @dodopayments/better-auth when the Dodo customer is created. */
  dodoCustomerId: text('dodo_customer_id'),
  /** Page language at signup ('en' | 'zh'), for emails. */
  locale: text('locale'),
  createdAt: authTime('created_at').notNull(),
  updatedAt: authTime('updated_at').notNull(),
})

export const session = sqliteTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: authTime('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: authTime('created_at').notNull(),
    updatedAt: authTime('updated_at').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (t) => [index('session_user_idx').on(t.userId)],
)

export const account = sqliteTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: authTime('access_token_expires_at'),
    refreshTokenExpiresAt: authTime('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: authTime('created_at').notNull(),
    updatedAt: authTime('updated_at').notNull(),
  },
  (t) => [index('account_user_idx').on(t.userId)],
)

export const verification = sqliteTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: authTime('expires_at').notNull(),
    createdAt: authTime('created_at').notNull(),
    updatedAt: authTime('updated_at').notNull(),
  },
  (t) => [index('verification_identifier_idx').on(t.identifier)],
)

// ---- Credits ledger (ported from ShotFrames) ----

/** One row per user: spendable and held (frozen) credits. Changed only by src/core/credits/ledger.ts. */
export const creditAccounts = sqliteTable('credit_accounts', {
  userId: text('user_id').primaryKey(),
  available: integer('available').notNull().default(0),
  frozen: integer('frozen').notNull().default(0),
  updatedAt: updatedAt(),
})

/** Append-only history; every balance change writes one row with the balance after it. */
export const creditTransactions = sqliteTable(
  'credit_transactions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    availableDelta: integer('available_delta').notNull(),
    frozenDelta: integer('frozen_delta').notNull(),
    /** grant | hold | commit | refund | adjust */
    type: text('type').notNull(),
    /** signup | payment_order | job | admin | … */
    sourceType: text('source_type').notNull(),
    sourceId: text('source_id').notNull(),
    availableAfter: integer('available_after').notNull(),
    frozenAfter: integer('frozen_after').notNull(),
    metadataJson: text('metadata_json'),
    createdAt: createdAt(),
  },
  (t) => [
    index('credit_tx_user_idx').on(t.userId, t.createdAt),
    // The same grant/hold/commit/refund for the same source can never apply twice.
    uniqueIndex('credit_tx_source_uq').on(t.type, t.sourceType, t.sourceId),
  ],
)

export const creditReservations = sqliteTable(
  'credit_reservations',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    amount: integer('amount').notNull(),
    /** held | committed | refunded */
    status: text('status').notNull().default('held'),
    sourceType: text('source_type').notNull(),
    sourceId: text('source_id').notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('credit_res_status_idx').on(t.status, t.createdAt)],
)

// ---- Payments ----

export const paymentOrders = sqliteTable(
  'payment_orders',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    provider: text('provider').notNull().default('dodo'),
    /** test_mode | live_mode | mock */
    mode: text('mode').notNull(),
    planCode: text('plan_code').notNull(),
    credits: integer('credits').notNull(),
    amountMinor: integer('amount_minor').notNull(),
    currency: text('currency').notNull(),
    /** created | checkout_started | paid | failed | refunded */
    status: text('status').notNull().default('created'),
    providerPaymentId: text('provider_payment_id'),
    providerSessionId: text('provider_session_id'),
    checkoutUrl: text('checkout_url'),
    metadataJson: text('metadata_json'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('payment_orders_user_idx').on(t.userId, t.createdAt), index('payment_orders_payment_idx').on(t.providerPaymentId)],
)

export const paymentWebhookEvents = sqliteTable('payment_webhook_events', {
  id: text('id').primaryKey(),
  provider: text('provider').notNull().default('dodo'),
  /** webhook-id header (unique per delivery attempt chain), so retries are recognised. */
  providerEventId: text('provider_event_id').notNull().unique(),
  eventType: text('event_type').notNull(),
  providerPaymentId: text('provider_payment_id'),
  orderId: text('order_id'),
  /** received | processed | ignored | failed */
  status: text('status').notNull().default('received'),
  errorMessage: text('error_message'),
  payloadJson: text('payload_json'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

// ---- Jobs (queue) ----

export const jobs = sqliteTable(
  'jobs',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull(),
    /** Key of a provider in src/site/generation.ts */
    kind: text('kind').notNull(),
    inputJson: text('input_json').notNull(),
    cost: integer('cost').notNull(),
    /** queued | running | succeeded | failed */
    status: text('status').notNull().default('queued'),
    reservationId: text('reservation_id'),
    /** R2 key of the result */
    outputKey: text('output_key'),
    outputType: text('output_type'),
    error: text('error'),
    attempts: integer('attempts').notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('jobs_user_idx').on(t.userId, t.createdAt), index('jobs_status_idx').on(t.status, t.updatedAt)],
)

// ---- Abuse protection ----

export const rateLimits = sqliteTable('rate_limits', {
  key: text('key').primaryKey(),
  count: integer('count').notNull(),
  /** epoch ms */
  resetAt: integer('reset_at').notNull(),
  updatedAt: updatedAt(),
})

// ---- Admin (separate identity, like ShotFrames) ----

export const adminUsers = sqliteTable('admin_users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  passwordSalt: text('password_salt').notNull(),
  /** owner | operator */
  role: text('role').notNull().default('owner'),
  /** active | disabled */
  status: text('status').notNull().default('active'),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const adminSessions = sqliteTable(
  'admin_sessions',
  {
    id: text('id').primaryKey(),
    adminUserId: text('admin_user_id').notNull(),
    tokenHash: text('token_hash').notNull().unique(),
    expiresAt: text('expires_at').notNull(),
    createdAt: createdAt(),
  },
  (t) => [index('admin_sessions_admin_idx').on(t.adminUserId)],
)

export const adminAuditLogs = sqliteTable(
  'admin_audit_logs',
  {
    id: text('id').primaryKey(),
    actor: text('actor').notNull(),
    action: text('action').notNull(),
    targetType: text('target_type'),
    targetId: text('target_id'),
    metadataJson: text('metadata_json'),
    createdAt: createdAt(),
  },
  (t) => [index('admin_audit_created_idx').on(t.createdAt)],
)
