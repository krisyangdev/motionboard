// Prints, per page type and language, how many pages are indexable and which are noindex with the reasons
// (the quality gates of src/core/seo/quality.ts). Reads content only; run with `npm run seo-report`.
import { LOCALES } from '../src/core/i18n.ts'
import { hubPagination, indexableLocales, pageLocales, sitePages } from '../src/core/pages.ts'

const pages = sitePages()
const types = [...new Set(pages.map((p) => p.type))]
let noindexTotal = 0

for (const type of types) {
  const ofType = pages.filter((p) => p.type === type)
  console.log(`\n${type}`)
  for (const l of LOCALES) {
    const here = ofType.filter((p) => pageLocales(p).includes(l))
    if (!here.length) continue
    const indexable = here.filter((p) => indexableLocales(p).includes(l))
    console.log(`  ${l}: ${here.length} pages, ${indexable.length} indexable, ${here.length - indexable.length} noindex`)
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
console.log(`\n${pages.length} pages, ${noindexTotal} page-language pairs noindex`)
