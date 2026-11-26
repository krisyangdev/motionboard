// `npm run stamp`: sets `updated` to today in every content file whose content changed since the last stamp and records
// the hashes in content/.hashes.json (commit that file). `npm run stamp -- --minor <slug> [<slug>...]` records a
// change without bumping the date (typo fixes). A slug names every language of a page: `getting-started`,
// `symbols/heart-symbols`, or a path such as `content/tools/word-counter.json`.
import { stamp } from '../src/core/seo/stamp.ts'

const args = process.argv.slice(2)
const at = args.indexOf('--minor')
const minor = at === -1 ? [] : args.slice(at + 1).filter((a) => !a.startsWith('--'))
const unknown = args.filter((a, i) => (a.startsWith('--') && a !== '--minor') || (at === -1 && !a.startsWith('--')) || (at !== -1 && i < at))
if (unknown.length || (at !== -1 && !minor.length)) {
  console.error('usage: npm run stamp [-- --minor <slug> [<slug>...]]')
  process.exit(1)
}

const d = new Date()
const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
try {
  const r = stamp({ today, minor })
  for (const rel of r.bumped) console.log(`updated ${today}: ${rel}`)
  for (const rel of r.minor) console.log(`recorded, date kept (minor): ${rel}`)
  for (const rel of r.added) console.log(`recorded new file: ${rel}`)
  for (const rel of r.removed) console.log(`dropped record of deleted file: ${rel}`)
  if (!r.bumped.length && !r.minor.length && !r.added.length && !r.removed.length) console.log('stamp: nothing changed')
} catch (e) {
  console.error(`stamp: ${e.message}`)
  process.exit(1)
}
