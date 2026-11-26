import { appEnv } from '../server/env'

export async function putObject(key: string, body: ArrayBuffer | string, contentType: string) {
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
