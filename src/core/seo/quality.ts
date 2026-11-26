// Build-time quality gates (spec §2.7): from a page's content, decide whether it may be indexed.
// A page below the minimum content of its type is still built and linkable, but noindex and out of the
// sitemap, with the reasons listed here (shown by `npm run seo-report`). Pure functions on content, Node only:
// pages.ts calls them while it builds the registry, and the results travel to the app through the content index.
import { isCjk, type AboutFrontmatter, type GuideFrontmatter, type HubText, type ItemText, type LegalFrontmatter, type ToolText } from '../content/schema.ts'

export type Verdict = { indexable: boolean; reasons: string[] }

/** Minimum content by page type. Word counts are [latin words, CJK characters]; the CJK figure applies to CJK text. */
export const MIN = {
  tool: { words: [250, 450], steps: [3, 4], faq: 4, examples: 1 },
  guide: { words: [600, 1100], h2: 2, links: 3, evidence: 1 },
  hub: { members: 6, intro: [50, 90] },
  about: { words: [150, 280] },
  legal: { words: [100, 180] },
  item: { words: [80, 150], dataEntries: 10, related: 3 },
} as const

/** Items of one collection and language whose texts share more than this Jaccard similarity of shingles are near-duplicates. */
export const NEAR_DUPLICATE_JACCARD = 0.6
/** Shingle size: words for Latin text, characters for CJK text. */
export const SHINGLE_SIZE = { words: 5, chars: 4 } as const

/** Default hub member minimum; a site may lower it with `seo.hubMinMembers` in site.config.ts (see hubMinMembers in pages.ts). */
export const DEFAULT_HUB_MIN_MEMBERS = MIN.hub.members

const verdict = (reasons: string[]): Verdict => ({ indexable: reasons.length === 0, reasons })

const CJK_CHAR = /[぀-ヿ㐀-鿿]/g
const LATIN_WORD = /[A-Za-z0-9À-ɏ]+(?:['’-][A-Za-z0-9À-ɏ]+)*/g

/** Latin words plus CJK characters of a text. */
export const wordCount = (text: string): number => (text.match(CJK_CHAR)?.length ?? 0) + (text.replace(CJK_CHAR, ' ').match(LATIN_WORD)?.length ?? 0)

/** The limit of a pair for a text's script. */
const pick = (pair: readonly [number, number], text: string) => pair[isCjk(text) ? 1 : 0]
const words = (what: string, have: number, want: number) => `${what}: ${have} words, at least ${want} (each CJK character counts as a word)`

/** Visible text of an MDX body: code, imports, tags and markdown syntax removed, link labels kept. */
export function plainText(mdx: string): string {
  return mdx
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^\s*(?:import|export)\s.*$/gm, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[`*_#>|~-]+/g, ' ')
}

/** H2 headings of an MDX body (`## ` lines outside code fences). */
export const h2Count = (mdx: string): number => (mdx.replace(/```[\s\S]*?```/g, '').match(/^##\s+\S/gm) ?? []).length

/** In-copy links to pages of this site: markdown `](/path)` and `href="/path"`. */
export const internalLinkCount = (mdx: string): number => (mdx.replace(/```[\s\S]*?```/g, '').match(/\]\(\/(?!\/)[^)\s]*\)|href=["']\/(?!\/)/g) ?? []).length

/** First-hand elements: the <Evidence> component, an <img> or <video>, or a markdown image. */
export const evidenceCount = (mdx: string): number => (mdx.replace(/```[\s\S]*?```/g, '').match(/<Evidence[\s>]|<img[\s>]|<video[\s>]|!\[[^\]]*\]\(/g) ?? []).length

/** Page-specific prose of a tool: lede, steps, sections, limits and FAQ. */
const toolText = (t: ToolText) =>
  [t.lede, ...(t.steps ?? []).flatMap((s) => [s.title, s.body]), ...(t.sections ?? []).flatMap((s) => [s.h2, s.body]), t.limits ?? '', ...(t.faq ?? []).flat()].join('\n')

export function toolVerdict(t: ToolText): Verdict {
  const reasons: string[] = []
  const min = pick(MIN.tool.words, t.title)
  const have = wordCount(toolText(t))
  if (have < min) reasons.push(words('page text (lede, steps, sections, limits, FAQ)', have, min))
  const steps = t.steps?.length ?? 0
  if (steps < MIN.tool.steps[0] || steps > MIN.tool.steps[1]) reasons.push(`steps: ${steps}, want ${MIN.tool.steps[0]} to ${MIN.tool.steps[1]}`)
  const faq = t.faq?.length ?? 0
  if (faq < MIN.tool.faq) reasons.push(`faq: ${faq} questions, at least ${MIN.tool.faq}`)
  const examples = t.examples?.length ?? 0
  if (examples < MIN.tool.examples) reasons.push(`examples: ${examples}, at least ${MIN.tool.examples}`)
  return verdict(reasons)
}

export function guideVerdict(fm: GuideFrontmatter, body: string): Verdict {
  const reasons: string[] = []
  const min = pick(MIN.guide.words, fm.title)
  const have = wordCount([fm.lede, plainText(body), ...(fm.faq ?? []).flat()].join('\n'))
  if (have < min) reasons.push(words('page text', have, min))
  const h2 = h2Count(body)
  if (h2 < MIN.guide.h2) reasons.push(`${h2} H2 headings, at least ${MIN.guide.h2}`)
  const links = internalLinkCount(body)
  if (links < MIN.guide.links) reasons.push(`${links} in-copy internal links, at least ${MIN.guide.links}`)
  const evidence = evidenceCount(body)
  if (evidence < MIN.guide.evidence) reasons.push('no first-hand element (an <Evidence> block, an image or a video)')
  return verdict(reasons)
}

/** `indexableMembers`: members of the hub in this language that are themselves indexable. */
export function hubVerdict(h: HubText, indexableMembers: number, minMembers: number = DEFAULT_HUB_MIN_MEMBERS): Verdict {
  const reasons: string[] = []
  if (indexableMembers < minMembers) reasons.push(`${indexableMembers} indexable members, at least ${minMembers}`)
  const min = pick(MIN.hub.intro, h.title)
  const have = wordCount(h.intro)
  if (have < min) reasons.push(words('intro', have, min))
  return verdict(reasons)
}

export function aboutVerdict(fm: AboutFrontmatter, body: string): Verdict {
  const min = pick(MIN.about.words, fm.title)
  const have = wordCount([fm.lede, plainText(body), ...(fm.faq ?? []).flat()].join('\n'))
  return verdict(have < min ? [words('page text', have, min)] : [])
}

export function legalVerdict(fm: LegalFrontmatter, body: string): Verdict {
  const reasons: string[] = []
  if (fm.noindex) reasons.push('noindex: true in the frontmatter')
  const min = pick(MIN.legal.words, fm.title)
  const have = wordCount(plainText(body))
  if (have < min) reasons.push(words('page text', have, min))
  return verdict(reasons)
}

// Programmatic items (collections). A failing item is not a build error: it renders noindex and is listed by seo-report.

/** Item-specific prose: lede, body blocks, FAQ and the text the collection takes from its `data`. Template strings are not part of it. */
export const itemText = (t: ItemText, dataText = ''): string =>
  [t.lede, ...t.body.flatMap((b) => [b.h2, b.body]), ...(t.faq ?? []).flat(), dataText].join('\n')

export type ItemFacts = {
  /** Text inside the item's `data` (see `dataText` of the collection). */
  dataText: string
  hasMedia: boolean
  /** Entries in the item's data block (see `dataEntries` of the collection). */
  dataEntries: number
}

/** The gates that look at the item alone: text, media or data. Related items and near-duplicates are decided across items (pages.ts). */
export function itemVerdict(t: ItemText, f: ItemFacts): Verdict {
  const reasons: string[] = []
  const min = pick(MIN.item.words, t.title)
  const have = wordCount(itemText(t, f.dataText))
  if (have < min) reasons.push(words('item text (lede, body, FAQ, data text)', have, min))
  if (!f.hasMedia && f.dataEntries < MIN.item.dataEntries) reasons.push(`no image or video, and ${f.dataEntries} data entries, want one media item or at least ${MIN.item.dataEntries} entries`)
  return verdict(reasons)
}

/** The reason for an item with too few related items. */
export const relatedReason = (n: number): string | undefined => (n < MIN.item.related ? `related: ${n} items, at least ${MIN.item.related}` : undefined)

/** Shingles of a text: runs of 4 characters for CJK text, of 5 words for other text (lower case, punctuation ignored). A text shorter than one shingle is one shingle. */
export function shingles(text: string): Set<string> {
  const lower = text.toLowerCase()
  const units = isCjk(text) ? [...lower.replace(/[^\p{L}\p{N}]/gu, '')] : (lower.match(LATIN_WORD) ?? [])
  const size = isCjk(text) ? SHINGLE_SIZE.chars : SHINGLE_SIZE.words
  const sep = isCjk(text) ? '' : ' '
  if (units.length === 0) return new Set()
  if (units.length <= size) return new Set([units.join(sep)])
  return new Set(Array.from({ length: units.length - size + 1 }, (_, i) => units.slice(i, i + size).join(sep)))
}

/** |A ∩ B| / |A ∪ B|; two empty sets are not similar. */
export function jaccard(a: ReadonlySet<string>, b: ReadonlySet<string>): number {
  const [small, large] = a.size <= b.size ? [a, b] : [b, a]
  let both = 0
  for (const x of small) if (large.has(x)) both++
  const union = a.size + b.size - both
  return union === 0 ? 0 : both / union
}

export type Duplicate = { of: string; similarity: number }

/**
 * Near-duplicate texts. `entries` are the items of one collection and language, oldest first: only a later item is
 * reported, against the earlier item it matches best (the earlier one keeps its place). Candidate pairs come from an
 * inverted index of shingles, so cost follows the number of shared shingles, not n squared.
 */
export function nearDuplicates(entries: readonly { id: string; text: string }[], threshold: number = NEAR_DUPLICATE_JACCARD): Map<string, Duplicate> {
  const sets = entries.map((e) => shingles(e.text))
  const postings = new Map<string, number[]>()
  sets.forEach((set, i) => {
    for (const s of set) {
      const list = postings.get(s)
      if (list) list.push(i)
      else postings.set(s, [i])
    }
  })
  const found = new Map<string, Duplicate>()
  sets.forEach((set, i) => {
    const shared = new Map<number, number>()
    for (const s of set) for (const j of postings.get(s)!) if (j < i) shared.set(j, (shared.get(j) ?? 0) + 1)
    for (const [j, both] of shared) {
      const similarity = both / (set.size + sets[j].size - both)
      if (similarity > threshold && similarity > (found.get(entries[i].id)?.similarity ?? 0)) found.set(entries[i].id, { of: entries[j].id, similarity })
    }
  })
  return found
}

export const duplicateReason = (d: Duplicate): string => `near-duplicate of ${d.of} (similarity ${d.similarity.toFixed(2)}, at most ${NEAR_DUPLICATE_JACCARD})`

/**
 * The build error for a collection (in one language) whose noindex share is above `max`, naming the collection and the
 * noindex items with their reasons; undefined when the share is within the limit.
 */
export function noindexShareError(collection: string, locale: string, noindex: readonly { path: string; reasons: readonly string[] }[], total: number, max: number): string | undefined {
  if (total === 0 || noindex.length / total <= max) return undefined
  const shown = noindex.slice(0, 25).map((n) => `  ${n.path}: ${n.reasons.join('; ')}`)
  const more = noindex.length > shown.length ? [`  and ${noindex.length - shown.length} more (npm run seo-report lists all)`] : []
  return [
    `collection "${collection}" (${locale}): ${noindex.length} of ${total} items are noindex (${Math.round((noindex.length / total) * 1000) / 10}%), more than seo.maxNoindexShare ${max} in site.config.ts.`,
    'Fix these items (more item-specific text, media or data, related items, no near-duplicates) instead of raising the limit:',
    ...shown,
    ...more,
  ].join('\n')
}
