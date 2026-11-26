import { describe, expect, it } from 'vitest'
import { LOCALES } from './i18n'
import en from './messages/en'
import es from './messages/es'
import zh from './messages/zh'
import { mockSite } from './test-site'

// Every dotted key path of a messages object; functions and strings are leaves.
const keys = (value: unknown, prefix = ''): string[] =>
  typeof value === 'object' && value !== null ? Object.entries(value).flatMap(([k, v]) => keys(v, `${prefix}${k}.`)) : [prefix.slice(0, -1)]

describe('core messages files', () => {
  it('zh.ts and es.ts have exactly the keys of en.ts', () => {
    const want = keys(en).sort()
    expect(keys(zh).sort()).toEqual(want)
    expect(keys(es).sort()).toEqual(want)
  })

  it('has no empty strings', () => {
    for (const [name, m] of Object.entries({ en, zh, es })) {
      const empty = keys(m).filter((k) => k.split('.').reduce<any>((o, p) => o[p], m) === '')
      expect(empty, name).toEqual([])
    }
  })

  it('the functions return text for the same arguments in every language', () => {
    for (const m of [en, zh, es]) {
      expect(m.app.signup.done('a@b.test')).toContain('a@b.test')
      expect(m.app.account.packCredits(5)).toContain('5')
      expect(m.email.verify.subject('Acme')).toContain('Acme')
      expect(m.email.receipt.subject('Acme', 'Pro')).toContain('Pro')
      expect(m.email.receipt.body({ plan: 'Pro', amount: '$5.00', credits: 100, contact: 'hi@acme.test' }).join(' ')).toContain('hi@acme.test')
    }
  })
})

describe('coreMessages', () => {
  it('has strings for every language of the shipped config', async () => {
    const { coreMessages } = await import('./messages')
    expect(Object.keys(coreMessages).sort()).toEqual([...LOCALES].sort())
  })

  it('loads Spanish when the site lists it', async () => {
    await mockSite(['en', 'zh', 'es'])
    const { coreMessages } = await import('./messages')
    expect(Object.keys(coreMessages)).toEqual(['en', 'zh', 'es'])
    expect((coreMessages as Record<string, typeof coreMessages.en>).es.page.home).toBe('Inicio')
  })

  it('names the file to add for a language without strings', async () => {
    await mockSite(['en', 'ar'])
    await expect(import('./messages')).rejects.toThrow('src/core/messages/ar.ts')
  })
})
