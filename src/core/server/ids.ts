/** Random id with a readable prefix: usr_…, ord_…, job_… */
export function createId(prefix: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12))
  return `${prefix}_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`
}

export const nowIso = () => new Date().toISOString()
