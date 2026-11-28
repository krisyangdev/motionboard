// The template's password hasher, used by Better Auth (user accounts) and by the admin identity.
// New hashes: scrypt through node:crypto at N=2^14, r=8, p=5 (one of OWASP's equivalent settings; 16 MiB, ~115 ms CPU).
// Cloudflare's WebCrypto refuses PBKDF2 above 100,000 iterations in production (local workerd allows it), so OWASP's
// 600k PBKDF2 cannot run there. Older hashes are PBKDF2-SHA256 (`pbkdf2-sha256$<iterations>$<salt>$<hash>`, 20k);
// they keep verifying, and a sign-in replaces them (needsRehash, src/core/auth/server.ts). Every hash stores its own
// parameters, so changing SCRYPT later keeps old hashes verifiable. A site that moves users in with another format
// sets src/site/auth.ts.
import { scrypt } from 'node:crypto'
import type { PasswordHasher } from '../../site/auth'

export const SCRYPT = { N: 16384, r: 8, p: 5 }
const KEY_BYTES = 32
const PBKDF2_PREFIX = 'pbkdf2-sha256'
const SCRYPT_PREFIX = 'scrypt'
const encoder = new TextEncoder()

const base64Url = (bytes: ArrayBuffer | Uint8Array) => {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let binary = ''
  for (const b of view) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function derivePbkdf2(password: string, salt: string, iterations: number): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: encoder.encode(salt), iterations, hash: 'SHA-256' }, key, 256)
  return base64Url(bits)
}

function deriveScrypt(password: string, salt: string, { N, r, p }: typeof SCRYPT): Promise<string> {
  return new Promise((resolve, reject) =>
    scrypt(password.normalize('NFKC'), salt, KEY_BYTES, { N, r, p, maxmem: 256 * N * r }, (error, key) => (error ? reject(error) : resolve(base64Url(key)))),
  )
}

export function timingSafeEqual(left: string, right: string): boolean {
  const a = encoder.encode(left)
  const b = encoder.encode(right)
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

/** `scrypt$<N>$<r>$<p>$<salt>$<hash>` */
export async function hashPassword(password: string): Promise<string> {
  const salt = base64Url(crypto.getRandomValues(new Uint8Array(16)))
  return [SCRYPT_PREFIX, SCRYPT.N, SCRYPT.r, SCRYPT.p, salt, await deriveScrypt(password, salt, SCRYPT)].join('$')
}

const isInt = (n: number, max: number) => Number.isInteger(n) && n > 0 && n <= max

/** False for a wrong password or a hash in another format. A malformed hash still costs one derivation, so timing reveals nothing. */
export async function verifyPassword({ hash, password }: { hash: string; password: string }): Promise<boolean> {
  const parts = hash.split('$')
  if (parts[0] === PBKDF2_PREFIX && parts.length === 4) {
    const [, iter, salt, expected] = parts
    const iterations = Number(iter)
    if (isInt(iterations, 100_000) && salt && expected) return timingSafeEqual(await derivePbkdf2(password, salt, iterations), expected)
  }
  if (parts[0] === SCRYPT_PREFIX && parts.length === 6) {
    const [, n, r, p, salt, expected] = parts
    const params = { N: Number(n), r: Number(r), p: Number(p) }
    const powerOfTwo = (params.N & (params.N - 1)) === 0
    if (isInt(params.N, 65536) && powerOfTwo && params.N > 1 && isInt(params.r, 16) && isInt(params.p, 16) && salt && expected) {
      return timingSafeEqual(await deriveScrypt(password, salt, params), expected)
    }
  }
  await deriveScrypt(password, 'invalid-hash', SCRYPT)
  return false
}

/** True for a template hash made with other parameters than today's (every PBKDF2 hash, or scrypt with old SCRYPT). */
export const needsRehash = (hash: string) => {
  const [prefix, n, r, p] = hash.split('$')
  if (prefix === PBKDF2_PREFIX) return true
  return prefix === SCRYPT_PREFIX && (Number(n) !== SCRYPT.N || Number(r) !== SCRYPT.r || Number(p) !== SCRYPT.p)
}

export const templateHasher: PasswordHasher = { hash: hashPassword, verify: verifyPassword }
