import { drizzle } from 'drizzle-orm/d1'
import { appEnv } from '../server/env'
import * as schema from './schema'

export { schema }
/** Drizzle client on the DB binding. Cheap to create; call it per request. */
export const db = () => drizzle(appEnv().DB, { schema })
export type Db = ReturnType<typeof db>
