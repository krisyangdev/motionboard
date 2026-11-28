// Types of the admin site slots: src/site/admin.ts (nav, read by the browser) and src/site/admin-jobs.ts (jobs source, server only).

/** One job as the admin pages show it. `email`, `attempts` and `updatedAt` only fill the Jobs page columns and may be left out. */
export type AdminJobRow = {
  id: string
  userId: string
  kind: string
  status: string
  cost: number
  error: string | null
  createdAt: Date | string | number
  email?: string | null
  attempts?: number
  updatedAt?: Date | string | number
}

/** Where a site keeps its jobs when they do not live in the template `jobs` table. */
export type AdminJobsSource = {
  /** Job counts per status, for the dashboard. */
  statusCounts(): Promise<{ status: string; count: number }[]>
  /** Newest first. `total` is the number of all rows. */
  list(opts: { limit: number; offset: number }): Promise<{ rows: AdminJobRow[]; total: number }>
  /** One user's newest jobs, for the user detail page. */
  forUser(userId: string, limit: number): Promise<AdminJobRow[]>
}

export type AdminNavItem = { to: string; label: string }

export type AdminSite = {
  nav?: AdminNavItem[]
}
