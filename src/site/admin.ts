// Site-owned admin nav, read by src/routes/admin/route.tsx (runs in the browser: import no server code here).
// An empty object is the template's own admin.
//
// - nav: extra entries appended to the admin nav, `{ to, label }` (e.g. `{ to: '/admin/prompts/', label: 'Prompts' }`).
//   The pages are ordinary route files in src/routes/admin/<name>.tsx.
// A site whose jobs live outside the template `jobs` table sets src/site/admin-jobs.ts.
import type { AdminSite } from '../core/admin/types'

export const adminSite: AdminSite = {}
