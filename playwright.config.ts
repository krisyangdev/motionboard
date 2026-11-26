import { defineConfig, devices } from '@playwright/test'

// End-to-end money path against the local Worker (built, served by `vite preview` in workerd with the
// local D1/R2/Queue and the mocks from .dev.vars: MOCK_PAYMENTS, MOCK_EMAIL, MOCK_GENERATION).
// Run: npm run e2e (applies local migrations first). Dev and preview share port 3000 so BETTER_AUTH_URL in .dev.vars fits both; stop npm run dev first.
export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  workers: 1,
  reporter: 'list',
  use: { baseURL: process.env.E2E_BASE_URL || 'http://127.0.0.1:3000', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: process.env.E2E_BASE_URL ? undefined : {
    command: 'npm run db:migrate:local && npm run build && npm run preview',
    url: 'http://127.0.0.1:3000/',
    timeout: 180_000,
    reuseExistingServer: true,
  },
})
