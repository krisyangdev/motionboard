// Build-time quality gates (spec §2.7): from a page's content, decide whether it may be indexed.
// A page below the minimum content of its type is still built and linkable, but noindex and out of the
// sitemap, with the reasons listed here (shown by `npm run seo-report`). Pure functions on content, Node only:
// pages.ts calls them while it builds the registry, and the results travel to the app through the content index.
import { isCjk, type AboutFrontmatter, type GuideFrontmatter, type HubText, type LegalFrontmatter, type ToolText } from '../content/schema.ts'

export type Verdict = { indexable: boolean; reasons: string[] }

/** Minimum content by page type. Word counts are [latin words, CJK characters]; the CJK figure applies to CJK text. */
export const MIN = {
  tool: { words: [250, 450], steps: [3, 4], faq: 4, examples: 1 },
  guide: { words: [600, 1100], h2: 2, links: 3, evidence: 1 },
  hub: { members: 6, intro: [50, 90] },
  about: { words: [150, 280] },
  legal: { words: [100, 180] },
} as const

/** Default hub member minimum; a site may lower it with `seo.hubMinMembers` in site.config.ts (see hubMinMembers in pages.ts). */
export const DEFAULT_HUB_MIN_MEMBERS = MIN.hub.members

const verdict = (reasons: string[]): Verdict => ({ indexable: reasons.length === 0, reasons })

const CJK_CHAR = /[぀-ヿ㐀-鿿]/g
const LATIN_WORD = /[A-Za-z0-9À-ɏ]+(?:['’-][A-Za-z0-9À-ɏ]+)*/g

/** Latin words plus CJK characters of a text. */
export const wordCount = (text: string): number => (text.match(CJK_CHAR)?.length ?? 0) + (text.replace(CJK_CHAR, ' ').match(LATIN_WORD)?.length ?? 0)

/** The limit of a pair for a text's script. */
const pick = (pair: readonly [number, number], text: string) => pair[isCjk(text) ? 1 : 0]
const words = (what: string, have: number, want: number) => `${what}: ${have} words, at least ${want}`

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
