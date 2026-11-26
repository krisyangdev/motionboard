// Site-owned: what the site sells. Product ids come from the Dodo dashboard (test and live mode
// have separate products). Only one-time credit packs are implemented; `subscription` is typed so a
// site can add it later without changing the shape.
import type { Locale } from '../core/i18n'

export type Plan = {
  code: string
  /** Dodo checkout slug */
  slug: string
  productId: { test_mode: string; live_mode: string }
  credits: number
  price: { amountMinor: number; currency: 'USD' }
  name: Record<Locale, string>
  effect: { kind: 'credits'; amount: number } | { kind: 'subscription'; creditsPerPeriod: number }
}

export const plans: Plan[] = [
  {
    code: 'starter',
    slug: 'starter-pack',
    productId: { test_mode: 'pdt_test_starter', live_mode: '' },
    credits: 100,
    price: { amountMinor: 500, currency: 'USD' },
    name: { en: 'Starter pack', zh: '入门包' },
    effect: { kind: 'credits', amount: 100 },
  },
  {
    code: 'pro',
    slug: 'pro-pack',
    productId: { test_mode: 'pdt_test_pro', live_mode: '' },
    credits: 500,
    price: { amountMinor: 2000, currency: 'USD' },
    name: { en: 'Pro pack', zh: '专业包' },
    effect: { kind: 'credits', amount: 500 },
  },
]

export const planByCode = (code: string) => plans.find((p) => p.code === code)
