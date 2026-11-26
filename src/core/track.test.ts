import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// track.ts keeps module state, so each test imports a fresh copy against freshly stubbed browser globals.
type Track = typeof import('./track')
const fresh = (): Promise<Track> => import('./track')

function stubBrowser(lang = 'en') {
  const beacons: string[] = []
  const events: Record<string, unknown>[] = []
  const win = { __events: events as unknown[] | undefined }
  vi.stubGlobal('window', win)
  vi.stubGlobal('document', {
    readyState: 'complete',
    referrer: '',
    documentElement: { lang },
    visibilityState: 'visible',
    addEventListener: () => {},
  })
  vi.stubGlobal('navigator', {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0 Safari/537.36',
    sendBeacon: (_url: string, blob: Blob) => {
      void blob.text().then((t) => beacons.push(t))
      return true
    },
  })
  vi.stubGlobal('location', { href: 'https://example.test/tools/x/', host: 'example.test', hostname: 'example.test', pathname: '/tools/x/' })
  vi.stubGlobal('screen', { width: 1440, height: 900 })
  vi.stubGlobal('innerWidth', 1200)
  vi.stubGlobal('innerHeight', 800)
  vi.stubGlobal('addEventListener', () => {})
  return { win, beacons }
}

beforeEach(() => {
  vi.resetModules()
  vi.spyOn(console, 'log').mockImplementation(() => {})
})
afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('without a key', () => {
  it('logs to the console and window.__events, adding lang and site', async () => {
    const { win } = stubBrowser('zh-CN')
    const { initTracking, track } = await fresh()
    initTracking({ site: 'demo', host: 'https://ph.test' })
    track('tool_start', { tool: 'merge', page: '/tools/merge/' })
    expect(console.log).toHaveBeenCalledWith('[track]', 'tool_start', { tool: 'merge', page: '/tools/merge/', lang: 'zh', site: 'demo' })
    expect(win.__events).toEqual([{ event: 'tool_start', tool: 'merge', page: '/tools/merge/', lang: 'zh', site: 'demo' }])
  })
  it('setTrackingLang overrides <html lang>', async () => {
    const { win } = stubBrowser('en')
    const { initTracking, setTrackingLang, track } = await fresh()
    initTracking({ site: 'demo', host: 'https://ph.test' })
    setTrackingLang('zh')
    track('download', { tool: 'merge', format: 'pdf' })
    expect(win.__events?.[0]).toMatchObject({ lang: 'zh' })
  })
  it('captureException logs a $exception event with the PostHog shape', async () => {
    const { win } = stubBrowser()
    const { initTracking, captureException } = await fresh()
    initTracking({ site: 'demo', host: 'https://ph.test' })
    captureException(new TypeError('boom'), { endpoint: '/api' })
    const e = win.__events?.[0] as Record<string, any>
    expect(e).toMatchObject({ event: '$exception', page: '/tools/x/', endpoint: '/api', $exception_message: 'boom', $exception_type: 'TypeError', site: 'demo' })
    expect(e.$exception_list[0]).toMatchObject({ type: 'TypeError', value: 'boom', stacktrace: { type: 'raw' } })
    expect(Array.isArray(e.$exception_list[0].stacktrace.frames)).toBe(true)
  })
  it('captureException accepts non-Error values and caps the volume', async () => {
    const { win } = stubBrowser()
    const { initTracking, captureException } = await fresh()
    initTracking({ site: 'demo', host: 'https://ph.test' })
    captureException('plain string')
    expect((win.__events?.[0] as Record<string, unknown>).$exception_message).toBe('plain string')
    for (let i = 0; i < 30; i++) captureException(new Error('again'))
    expect(win.__events).toHaveLength(10)
  })
})

describe('with a key', () => {
  it('batches events to PostHog with lang, site and no person profile', async () => {
    const { win, beacons } = stubBrowser('en')
    const { initTracking, track } = await fresh()
    initTracking({ site: 'demo', key: 'phc_test', host: 'https://ph.test' })
    track('cta_click', { page: '/tools/x/', to: 'github' })
    await vi.waitFor(() => expect(beacons).toHaveLength(1))
    const body = JSON.parse(beacons[0])
    expect(body.api_key).toBe('phc_test')
    expect(body.batch).toHaveLength(1)
    expect(body.batch[0]).toMatchObject({ event: 'cta_click', properties: { page: '/tools/x/', to: 'github', lang: 'en', site: 'demo', $process_person_profile: false, $browser: 'Chrome', $os: 'Mac OS X' } })
    expect(body.batch[0].distinct_id).toBeTruthy()
    expect(win.__events).toEqual([]) // nothing goes to the console buffer
  })
})

describe('referrerType', () => {
  it('classifies the referrer', async () => {
    stubBrowser()
    const { referrerType } = await fresh()
    const set = (referrer: string) => vi.stubGlobal('document', { referrer, documentElement: { lang: 'en' } })
    set('')
    expect(referrerType()).toBe('direct')
    set('https://www.google.com/search?q=x')
    expect(referrerType()).toBe('search')
    set('https://x.com/a')
    expect(referrerType()).toBe('social')
    set('https://example.test/a')
    expect(referrerType()).toBe('internal')
    set('https://blog.test/a')
    expect(referrerType()).toBe('other')
  })
})
