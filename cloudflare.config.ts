import { defineConfig } from 'cf/config'
import { SITE } from './site.config.ts'

export default defineConfig({
  worker: {
    name: SITE.worker,
    compatibilityDate: '2026-11-20',
    compatibilityFlags: ['nodejs_compat'],
    entrypoint: '@tanstack/react-start/server-entry',
    observability: { enabled: true },
    domains: [SITE.domain],
  },
})
