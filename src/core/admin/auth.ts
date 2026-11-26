// Admin identity: separate from Better Auth users. Email + password (PBKDF2) → session row → `asid` cookie.
import { and, eq, gt } from 'drizzle-orm'
import { db, schema } from '../db'
import { createId, nowIso } from '../server/ids'
import { HttpError } from '../server/http'
import { hashPassword, randomToken, sha256Hex, verifyPassword } from './crypto'

const COOKIE = 'asid'
const SESSION_SECONDS = 14 * 24 * 60 * 60

export type AdminRole = 'owner' | 'operator'
export type AdminIdentity = { id: string; email: string; role: AdminRole }

export const normalizeEmail = (email: string) => email.trim().toLowerCase()

// ---- Cookie ----

// Secure is dropped on plain http (local dev on 127.0.0.1) or the browser would not store the cookie.
const secureFlag = (request: Request) => (new URL(request.url).protocol === 'https:' ? '; Secure' : '')

export const sessionCookie = (request: Request, token: string) =>
  `${COOKIE}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_SECONDS}${secureFlag(request)}`

export const clearedSessionCookie = (request: Request) => `${COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secureFlag(request)}`

function readSessionToken(request: Request): string | null {
  for (const part of (request.headers.get('cookie') ?? '').split(';')) {
    const [name, ...value] = part.trim().split('=')
    if (name === COOKIE) return value.join('=') || null
  }
  return null
}

// ---- Sessions ----

/** The signed-in admin for this request, or 401 `admin_unauthorized`. */
export async function requireAdmin(request: Request): Promise<AdminIdentity> {
  const token = readSessionToken(request)
  if (token) {
    const [row] = await db()
      .select({ id: schema.adminUsers.id, email: schema.adminUsers.email, role: schema.adminUsers.role })
      .from(schema.adminSessions)
      .innerJoin(schema.adminUsers, eq(schema.adminUsers.id, schema.adminSessions.adminUserId))
      .where(
        and(
          eq(schema.adminSessions.tokenHash, await sha256Hex(token)),
          gt(schema.adminSessions.expiresAt, nowIso()),
          eq(schema.adminUsers.status, 'active'),
        ),
      )
      .limit(1)
    if (row) return { id: row.id, email: row.email, role: row.role as AdminRole }
  }
  throw new HttpError(401, 'Sign in required', 'admin_unauthorized')
}

/** Checks the password, creates a session and audits the login. The caller sets the cookie. */
export async function loginAdmin(input: { email: string; password: string }): Promise<{ admin: AdminIdentity; token: string }> {
  const email = normalizeEmail(input.email)
  const [row] = await db().select().from(schema.adminUsers).where(eq(schema.adminUsers.email, email)).limit(1)
  // Hash even when the admin does not exist, so response time does not reveal which emails are admins.
  const ok = await verifyPassword(input.password, row?.passwordSalt ?? 'unknown-admin', row?.passwordHash ?? '')
  if (!row || row.status !== 'active' || !ok) throw new HttpError(401, 'Invalid email or password', 'invalid_credentials')

  const token = randomToken(32)
  await db().insert(schema.adminSessions).values({
    id: createId('ases'),
    adminUserId: row.id,
    tokenHash: await sha256Hex(token),
    expiresAt: new Date(Date.now() + SESSION_SECONDS * 1000).toISOString(),
  })
  await audit(row.id, 'admin.login', 'admin_user', row.id)
  return { admin: { id: row.id, email: row.email, role: row.role as AdminRole }, token }
}

export async function logoutAdmin(request: Request, admin: AdminIdentity): Promise<void> {
  const token = readSessionToken(request)
  if (token) await db().delete(schema.adminSessions).where(eq(schema.adminSessions.tokenHash, await sha256Hex(token)))
  await audit(admin.id, 'admin.logout', 'admin_user', admin.id)
}

/** Creates the admin, or resets the password and role of an existing one (all its sessions are revoked). */
export async function provisionAdmin(input: { email: string; password: string; role: AdminRole }): Promise<{ admin: AdminIdentity; created: boolean }> {
  const email = normalizeEmail(input.email)
  const { hash, salt } = await hashPassword(input.password)
  const [existing] = await db().select({ id: schema.adminUsers.id }).from(schema.adminUsers).where(eq(schema.adminUsers.email, email)).limit(1)
  if (existing) {
    await db().batch([
      db()
        .update(schema.adminUsers)
        .set({ passwordHash: hash, passwordSalt: salt, role: input.role, status: 'active', updatedAt: nowIso() })
        .where(eq(schema.adminUsers.id, existing.id)),
      db().delete(schema.adminSessions).where(eq(schema.adminSessions.adminUserId, existing.id)),
    ])
    return { admin: { id: existing.id, email, role: input.role }, created: false }
  }
  const id = createId('adm')
  await db().insert(schema.adminUsers).values({ id, email, passwordHash: hash, passwordSalt: salt, role: input.role })
  return { admin: { id, email, role: input.role }, created: true }
}

// ---- Audit log ----

export async function audit(actorId: string, action: string, targetType?: string, targetId?: string, metadata?: unknown): Promise<void> {
  await db()
    .insert(schema.adminAuditLogs)
    .values({
      id: createId('aud'),
      actor: actorId,
      action,
      targetType: targetType ?? null,
      targetId: targetId ?? null,
      metadataJson: metadata === undefined ? null : JSON.stringify(metadata),
    })
}
