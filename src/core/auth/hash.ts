// The template's password hasher: PBKDF2-SHA256 through WebCrypto, used by Better Auth (user accounts) and by the
// admin identity. Workers Free gives a request 10 ms of CPU; scrypt (Better Auth's default) takes ~60 ms and PBKDF2 at
// 100k iterations ~11 ms, so neither fits. 20,000 iterations measured 2-4 ms, which leaves room for the rest of a
// sign-in (D1 queries, session token, cookie signing). The iteration count is stored in each hash, so raising
// ITERATIONS later keeps old hashes verifiable. A site that moves users in with another format sets src/site/auth.ts.
import type { PasswordHasher } from '../../site/auth'

export const ITERATIONS = 20_000
const PREFIX = 'pbkdf2-sha256'
const encoder = new TextEncoder()

const base64Url = (bytes: ArrayBuffer | Uint8Array) => {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let binary = ''
  for (const b of view) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function derive(password: string, salt: string, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: encoder.encode(salt), iterations, hash: 'SHA-256' }, key, 256)
  return base64Url(bits)
}

export function timingSafeEqual(left: string, right: string): boolean {
  const a = encoder.encode(left)
  const b = encoder.encode(right)
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

/** `pbkdf2-sha256$<iterations>$<salt>$<hash>` */
export async function hashPassword(password: string): Promise<string> {
  const salt = base64Url(crypto.getRandomValues(new Uint8Array(16)))
  return [PREFIX, ITERATIONS, salt, await derive(password, salt, ITERATIONS)].join('$')
}

/** False for a wrong password or a hash in another format. A malformed hash still costs one derivation, so timing reveals nothing. */
export async function verifyPassword({ hash, password }: { hash: string; password: string }): Promise<boolean> {
  const [prefix, iter, salt, expected] = hash.split('$')
  const iterations = Number(iter)
  const valid = prefix === PREFIX && Number.isInteger(iterations) && iterations > 0 && iterations <= 100_000 && !!salt && !!expected
  const actual = await derive(password, valid ? salt : 'invalid-hash', valid ? iterations : ITERATIONS)
  return valid && timingSafeEqual(actual, expected)
}

export const templateHasher: PasswordHasher = { hash: hashPassword, verify: verifyPassword }
