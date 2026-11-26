import { defineConfig } from 'drizzle-kit'

// Only generates SQL; migrations are applied with `cf d1 migrations apply` (npm run db:migrate:*).
export default defineConfig({
  dialect: 'sqlite',
  schema: './src/core/db/schema.ts',
  out: './migrations',
})
