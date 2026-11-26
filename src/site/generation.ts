// Site-owned: the generation providers, keyed by job kind (the `kind` sent to POST /api/jobs).
// To plug in a real model: keep the key, make `cost` return the credits one run costs, and make
// `run` call the model API (read secrets with appEnv() from src/core/server/env.ts) and return the
// file as { body, contentType, ext }. The queue stores it in R2 and settles the credits. Throw to
// fail a run: the job is retried up to 3 times, then failed and the credits are refunded.
// With MOCK_GENERATION=true the queue uses src/core/jobs/mock-provider.ts instead of `run`.
import type { GenerationProvider } from '../core/jobs/types'

export const providers: Record<string, GenerationProvider> = {
  'demo-image': {
    cost: () => 5,
    run: async () => {
      throw new Error('No real provider configured: set MOCK_GENERATION=true or implement run()')
    },
  },
}
