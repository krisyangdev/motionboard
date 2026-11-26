// Browser auth client. Same origin as the Worker, so no baseURL.
import { dodopaymentsClient } from '@dodopayments/better-auth/client'
import { createAuthClient } from 'better-auth/react'
import { inferAdditionalFields } from 'better-auth/client/plugins'

export const authClient = createAuthClient({
  plugins: [dodopaymentsClient(), inferAdditionalFields({ user: { locale: { type: 'string', required: false } } })],
})
