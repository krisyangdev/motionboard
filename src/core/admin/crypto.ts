// Token helpers for the admin identity (WebCrypto only, runs on Workers). Passwords use src/core/auth/hash.ts.

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

export { timingSafeEqual } from '../auth/hash'
