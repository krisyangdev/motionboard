// Hub pagination rules and the paths of collection pages, shared by the registry (pages.ts, Node) and the routes (app): imports nothing from either.
// Page 1 is the hub itself (/guides/), page n is /guides/page/<n>/.

/** Default-language path of an item of a collection. */
export const itemPath = (collection: string, slug: string) => `/${collection}/${slug}/`

/** Hub id of a category hub: its file is content/hubs/<collection>/<category>.json and its page /<collection>/<category>/. */
export const categoryHubId = (collection: string, category: string) => `${collection}/${category}`

/** Members on a hub page unless the hub file sets `pageSize`; also the maximum. */
export const HUB_PAGE_SIZE = 60

/** Number of pages for `total` members, at least 1 (an empty hub still has its page). */
export const hubPageCount = (total: number, pageSize: number): number => Math.max(1, Math.ceil(total / pageSize))

/** Default-language path of page `n` of the hub at `hubPath` (leading and trailing slash). */
export const hubPagePath = (hubPath: string, n: number): string => (n <= 1 ? hubPath : `${hubPath}page/${n}/`)

/** The members shown on page `n` (1-based). */
export const hubPageSlice = <T>(members: readonly T[], n: number, pageSize: number): T[] => members.slice((n - 1) * pageSize, n * pageSize)

/** URL base of the hand-written page types beyond tools and guides: /compare/<slug>/, /alternatives/<slug>/, /glossary/<slug>/, /for/<slug>/, /gallery/<slug>/. */
export const PAGE_BASES = { compare: '/compare/', alternatives: '/alternatives/', glossary: '/glossary/', 'use-case': '/for/', gallery: '/gallery/' } as const
export type BasedType = keyof typeof PAGE_BASES

/** Default-language path of a page of one of those types. */
export const typedPath = (type: BasedType, slug: string) => `${PAGE_BASES[type]}${slug}/`

/** The changelog is one page; entries beyond CHANGELOG_PAGE_SIZE continue at /changelog/page/<n>/. */
export const CHANGELOG_PATH = '/changelog/'
export const CHANGELOG_PAGE_SIZE = 50
