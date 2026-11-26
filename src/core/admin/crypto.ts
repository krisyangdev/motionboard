// Password hashing and token helpers for the admin identity (WebCrypto only, runs on Workers).

// Workers caps PBKDF2 at 100,000 iterations.
const ITERATIONS = 100_000

const encoder = new TextEncoder()

const base64Url = (bytes: ArrayBuffer | Uint8Array) => {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let binary = ''
  for (const b of view) binary += String.fromCharCode(b)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export const randomToken = (byteLength = 32) => base64Url(crypto.getRandomValues(new Uint8Array(byteLength)))

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value))
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

async function derive(password: string, salt: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: encoder.encode(salt), iterations: ITERATIONS, hash: 'SHA-256' }, key, 256)
  return base64Url(bits)
}

export async function hashPassword(password: string): Promise<{ hash: string; salt: string }> {
  const salt = randomToken(16)
  return { hash: await derive(password, salt), salt }
}

export async function verifyPassword(password: string, salt: string, expectedHash: string): Promise<boolean> {
  return timingSafeEqual(await derive(password, salt), expectedHash)
}

export function timingSafeEqual(left: string, right: string): boolean {
  const a = encoder.encode(left)
  const b = encoder.encode(right)
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}
