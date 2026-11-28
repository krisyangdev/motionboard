// Site-owned job source for the admin, read by src/core/admin/queries.ts (server only).
// Unset = the template `jobs` table. Set it when the site keeps its jobs elsewhere: it then feeds the dashboard status
// counts, the Jobs page and the jobs section of the user page, and core never reads the `jobs` table.
import type { AdminJobsSource } from '../core/admin/types'

export const adminJobs: AdminJobsSource | undefined = undefined
