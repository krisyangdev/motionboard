// Content freshness: `npm run stamp` (scripts/stamp.mjs) keeps `updated` and the sitemap `lastmod` honest.
// Every content file of the template's page types has a hash of its content (without `updated`) in content/.hashes.json.
// A file whose hash differs from the record gets `updated` set to today; `--minor <slug>` records the new hash and keeps
// the date (typo fixes). `npm test` fails while a hash differs from its record. Pages a site adds through `extraPages`
// are not content files and manage their own `lastmod`. Node only.
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Folders of content/ that hold pages. Add the folder of a new page type here (SEO step 5: compare, alternatives, glossary, use cases, gallery, changelog). */
export const STAMP_DIRS = ['tools', 'guides', 'legal', 'about', 'hubs', 'collections']
export const HASHES_FILE = 'content/.hashes.json'

const ROOT = fileURLToPath(new URL('../../..', import.meta.url))

const sortKeys = (v: unknown): unknown =>
  Array.isArray(v)
    ? v.map(sortKeys)
    : v && typeof v === 'object'
      ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)).map(([k, x]) => [k, sortKeys(x)]))
      : v

const sha = (s: string) => createHash('sha256').update(s).digest('hex').slice(0, 16)

/**
 * Hash of a content file without its `updated` date: a JSON file by its parsed content (key order and formatting do
 * not matter), an MDX file by its frontmatter lines and body (line endings and trailing blank lines do not matter).
 */
export function hashContent(rel: string, text: string): string {
  if (rel.endsWith('.json')) {
    const data = JSON.parse(text) as Record<string, unknown>
    delete data.updated
    return sha(JSON.stringify(sortKeys(data)))
  }
  const src = text.replace(/\r\n/g, '\n')
  const fm = /^---\n([\s\S]*?)\n---/.exec(src)
  const head = (fm?.[1] ?? '').split('\n').filter((l) => !/^updated:/.test(l)).join('\n')
  return sha(`${head}\n---\n${(fm ? src.slice(fm[0].length) : src).trimEnd()}`)
}

/** `text` with `updated` set to `date`: the top-level `"updated"` line of a JSON file (two-space indent) or the `updated:` line of MDX frontmatter. Quotes are kept. */
export function setUpdated(rel: string, text: string, date: string): string {
  if (rel.endsWith('.json')) {
    const re = /^(  "updated": ")\d{4}-\d{2}-\d{2}(")/m
    if (!re.test(text)) throw new Error(`${rel}: no top-level line  "updated": "YYYY-MM-DD"  (two-space indent) to bump`)
    return text.replace(re, `$1${date}$2`)
  }
  const fm = /^---\r?\n[\s\S]*?\r?\n---/.exec(text)
  const re = /^(updated:[ \t]*)(["']?)\d{4}-\d{2}-\d{2}\2(?=[ \t]*\r?$)/m
  if (!fm || !re.test(fm[0])) throw new Error(`${rel}: no frontmatter line  updated: YYYY-MM-DD  to bump`)
  return fm[0].replace(re, `$1$2${date}$2`) + text.slice(fm[0].length)
}

/** True when `arg` (a slug, `<collection>/<slug>`, or a path with or without `content/` and the extension) names the file `rel`. */
export function matchesSlug(rel: string, arg: string): boolean {
  const strip = (s: string) => s.replace(/^\/+|\/+$/g, '').replace(/^content\//, '').replace(/\.(json|mdx)$/, '')
  const key = strip(rel)
  const a = strip(arg)
  return key === a || key.endsWith(`/${a}`)
}

const walk = (dir: string, prefix: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(join(dir, e.name), `${prefix}/${e.name}`) : /\.(json|mdx)$/.test(e.name) ? [`${prefix}/${e.name}`] : [],
  )

/** Content files of the page types (paths relative to the repo root, `content/...`), sorted. */
export function contentFiles(root = ROOT): string[] {
  return STAMP_DIRS.flatMap((d) => (existsSync(join(root, 'content', d)) ? walk(join(root, 'content', d), `content/${d}`) : [])).sort()
}

export function readHashes(root = ROOT): Record<string, string> {
  const file = join(root, HASHES_FILE)
  return existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as Record<string, string>) : {}
}

export type StampStatus = {
  /** Current hash of every content file. */
  current: Record<string, string>
  /** Recorded, and the content differs from the record. */
  changed: string[]
  /** Content files with no record. */
  added: string[]
  /** Records of files that no longer exist. */
  removed: string[]
}

/** Compares the content files with content/.hashes.json. */
export function stampStatus(root = ROOT): StampStatus {
  const recorded = readHashes(root)
  const current = Object.fromEntries(contentFiles(root).map((rel) => [rel, hashContent(rel, readFileSync(join(root, rel), 'utf8'))]))
  return {
    current,
    changed: Object.keys(current).filter((rel) => rel in recorded && recorded[rel] !== current[rel]),
    added: Object.keys(current).filter((rel) => !(rel in recorded)),
    removed: Object.keys(recorded).filter((rel) => !(rel in current)),
  }
}

export type StampResult = { bumped: string[]; minor: string[]; added: string[]; removed: string[] }

/**
 * Sets `updated` to `today` in every changed file (except the ones `minor` names), then records the hashes.
 * New files are recorded as they are (the author set `published` and `updated`); records of deleted files are dropped.
 */
export function stamp(opts: { today: string; minor?: string[]; root?: string }): StampResult {
  const root = opts.root ?? ROOT
  const minor = opts.minor ?? []
  const status = stampStatus(root)
  for (const arg of minor) if (!Object.keys(status.current).some((rel) => matchesSlug(rel, arg))) throw new Error(`--minor ${arg}: no content file matches`)
  const bumped: string[] = []
  const kept: string[] = []
  for (const rel of status.changed) {
    if (minor.some((a) => matchesSlug(rel, a))) {
      kept.push(rel)
      continue
    }
    const file = join(root, rel)
    writeFileSync(file, setUpdated(rel, readFileSync(file, 'utf8'), opts.today))
    bumped.push(rel)
  }
  // `updated` is not part of the hash, so the hashes read before the bump still hold.
  writeFileSync(join(root, HASHES_FILE), `${JSON.stringify(status.current, null, 2)}\n`)
  return { bumped, minor: kept, added: status.added, removed: status.removed }
}
