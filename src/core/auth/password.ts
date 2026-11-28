// Password hashing for Better Auth emailAndPassword: the site's hook (authSite.password in src/site/auth.ts) when
// set, else the template's PBKDF2 hasher (src/core/auth/hash.ts).
import { authSite } from '../../site/auth'
import { templateHasher } from './hash'

export const passwordOptions = () => ({ password: authSite.password ?? templateHasher })
