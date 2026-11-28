import { appEnv } from '../server/env'

/** Largest object the template writes. R2 bills storage and operations above its free tier. */
export const MAX_OBJECT_BYTES = 10 * 1024 * 1024

const byteLength = (body: ArrayBuffer | string) => (typeof body === 'string' ? new TextEncoder().encode(body).byteLength : body.byteLength)

/** Writes one object; throws (nothing written) when it is larger than MAX_OBJECT_BYTES. */
export async function putObject(key: string, body: ArrayBuffer | string, contentType: string) {
  const size = byteLength(body)
  if (size > MAX_OBJECT_BYTES) throw new Error(`R2 object ${key} is ${size} bytes, more than MAX_OBJECT_BYTES (${MAX_OBJECT_BYTES})`)
  await appEnv().BUCKET.put(key, body, { httpMetadata: { contentType } })
}

/** True when `key` is a plain path under `jobs/<userId>/` (no traversal tricks). */
export function isOwnedKey(key: string, userId: string): boolean {
  if (!/^[\w-]+$/.test(userId)) return false
  return (
    key.length <= 512 &&
    key.startsWith(`jobs/${userId}/`) &&
    !key.includes('..') &&
    !key.includes('//') &&
    !key.includes('\\') &&
    !key.includes('\0')
  )
}

/** The object, or null when it does not exist or belongs to someone else. */
export async function getObjectForUser(key: string, userId: string): Promise<R2ObjectBody | null> {
  if (!isOwnedKey(key, userId)) return null
  return appEnv().BUCKET.get(key)
}
