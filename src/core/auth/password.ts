// The site's password hasher hook (src/site/auth.ts) as Better Auth emailAndPassword options.
// Undefined = Better Auth's default hasher.
import { password } from '../../site/auth'

export const passwordOptions = () => (password ? { password } : {})
