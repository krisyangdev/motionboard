// JSON helpers for API routes (src/routes/api/**).
import type { z } from 'zod'

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
    public code = 'error',
  ) {
    super(message)
  }
}

export const json = (data: unknown, init?: ResponseInit) =>
  new Response(JSON.stringify(data), {
    ...init,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...init?.headers },
  })

/**
 * Wraps a route handler: HttpError → JSON `{ error, code }` with its status; anything else → 500
 * and a PostHog exception. Imported lazily so this module stays free of server-only imports.
 */
export function handle<A extends { request: Request }>(fn: (args: A) => Promise<Response>) {
  return async (args: A): Promise<Response> => {
    try {
      return await fn(args)
    } catch (error) {
      if (error instanceof HttpError) return json({ error: error.message, code: error.code }, { status: error.status })
      if (error instanceof Response) return error
      console.error(error)
      const { captureServerException } = await import('./track')
      captureServerException(error, { path: new URL(args.request.url).pathname })
      return json({ error: 'Something went wrong', code: 'internal' }, { status: 500 })
    }
  }
}

export const requestIp = (request: Request) =>
  request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'

/** Parses the JSON body with a zod schema; 400 on invalid input. */
export async function readJson<T extends z.ZodType>(request: Request, schema: T): Promise<z.infer<T>> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    throw new HttpError(400, 'Invalid JSON body', 'bad_request')
  }
  const parsed = schema.safeParse(body)
  if (!parsed.success) throw new HttpError(400, parsed.error.issues[0]?.message ?? 'Invalid input', 'bad_request')
  return parsed.data
}
