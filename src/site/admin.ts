// Site-owned admin extensions, read by src/core/admin/queries.ts and src/routes/admin/route.tsx. Every field is
// optional; an empty object is the template's own admin.
//
// - nav: extra entries appended to the admin nav, `{ to, label }` (e.g. `{ to: '/admin/prompts/', label: 'Prompts' }`).
//   The pages are ordinary route files in src/routes/admin/<name>.tsx.
// - jobs: replaces the template `jobs` table as the source of job data in the admin (dashboard status counts, the Jobs
//   page, the jobs section of the user page). With it set, core never reads the `jobs` table.
import type { AdminSite } from '../core/admin/types'

export const adminSite: AdminSite = {}
