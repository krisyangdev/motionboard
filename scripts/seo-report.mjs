// Prints, per page type (per collection for items) and language, how many pages are indexable and which are noindex with
// the reasons (the quality gates of src/core/seo/quality.ts). Reads content only; run with `npm run seo-report`.
// Exits 1 when a collection has more noindex items than `seo.maxNoindexShare` allows (the build fails on the same rule).
import { LOCALES } from '../src/core/i18n.ts'
import { hubPagination, indexableLocales, noindexShareErrors, pageLocales, sitePages } from '../src/core/pages.ts'
import { stalePages } from '../src/core/seo/freshness.ts'

const pages = sitePages({ skipShareCheck: true })
const groupOf = (p) => (p.collection ? `${p.type}: ${p.collection}` : p.type)
const isCollection = (group) => group.startsWith('item: ')
const groups = [...new Set(pages.map(groupOf))]
let noindexTotal = 0

for (const group of groups) {
  const ofGroup = pages.filter((p) => groupOf(p) === group)
  console.log(`\n${group}`)
  for (const l of LOCALES) {
    const here = ofGroup.filter((p) => pageLocales(p).includes(l))
    if (!here.length) continue
    const indexable = here.filter((p) => indexableLocales(p).includes(l))
    const share = here.length - indexable.length
    console.log(`  ${l}: ${here.length} pages, ${indexable.length} indexable, ${share} noindex${isCollection(group) ? ` (${Math.round((share / here.length) * 1000) / 10}% of the collection)` : ''}`)
    for (const p of here.filter((p) => p.noindex?.[l])) {
      noindexTotal++
      console.log(`    noindex ${p.path}`)
      for (const r of p.noindex[l]) console.log(`      - ${r}`)
    }
  }
}

const paged = hubPagination()
if (paged.length) {
  console.log('\npaginated hub pages (prerendered, never in the sitemap)')
  for (const p of paged) console.log(`  ${p.path}: ${p.locales.join(', ')}${p.noindex.length ? ` (noindex in ${p.noindex.join(', ')})` : ''}`)
}
// Pages with third-party facts or prices (comparison, alternatives) older than 180 days and guides older than 365: check the facts, prices and sources, edit what changed, then `npm run stamp`. A stale page is a warning, not a failure.
const stale = stalePages(pages, new Date().toISOString().slice(0, 10))
if (stale.length) {
  console.log('\nstale pages (check the facts, prices and sources, edit what changed, then npm run stamp)')
  for (const s of stale) console.log(`  ${s.path}: ${s.type}, updated ${s.updated}, ${s.days} days ago, limit ${s.limit}`)
}
console.log(`\n${pages.length} pages, ${noindexTotal} page-language pairs noindex${stale.length ? `, ${stale.length} stale` : ''}`)

const errors = noindexShareErrors()
if (errors.length) {
  console.error(`\nFAIL ${errors.length} collection(s) above seo.maxNoindexShare (the build fails):\n\n${errors.join('\n\n')}`)
  process.exit(1)
}
