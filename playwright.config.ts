import { defineConfig, devices } from '@playwright/test'

// End-to-end money path against the local Worker (built, served by `vite preview` in workerd with the
// local D1/R2/Queue and the mocks from .dev.vars: MOCK_PAYMENTS, MOCK_EMAIL, MOCK_GENERATION).
// Run: npm run e2e (applies local migrations first). Dev and preview share port 3000 so BETTER_AUTH_URL in .dev.vars fits both; stop npm run dev first.
// Local runs build and serve the template on port 3000, or E2E_PORT (BETTER_AUTH_URL in .dev.vars must name the same port). A busy port fails the run
// instead of testing whatever is there; stop the other server, or run against a deployed URL with E2E_BASE_URL.
const PORT = process.env.E2E_PORT || '3000'

export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  workers: 1,
  reporter: 'list',
  use: { baseURL: process.env.E2E_BASE_URL || `http://127.0.0.1:${PORT}`, trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.E2E_BASE_URL ? undefined : {
    command: `npm run db:migrate:local && npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://127.0.0.1:${PORT}/`,
    timeout: 180_000,
    // Never test a server this run did not start: another project's dev server may hold the port.
    reuseExistingServer: false,
  },
})
