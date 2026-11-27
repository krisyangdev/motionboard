// Build-time generator for everything derived from the recipe data, from content/recipes/terms.json,
// content/recipes/en.json, content/recipes/seo/<slug>.json, content/pages/<id>.json and
// skills/motionboard/source/<video>/. Run before every dev start and build (npm predev / prebuild).
// Writes (all gitignored except the README tables and the skill's recipes/):
//   src/site/data/gen/index.json and text/<slug>.<locale>.json: index.json is bundled with every page,
//     the long text of one recipe is a chunk only the recipe page loads; search.json is the home search's
//     haystack, imported on first use
//   src/site/data/gen/pages.json, videos.json, redirects.txt, llms.txt: read by src/site/pages.ts, which
//     feeds the template's sitemap, video sitemap, _redirects and llms.txt generation
//   public/r/<slug>.md and index.md (recipe files for agents, fetched with curl) and public/source (copy of
//     skills/motionboard/source)
//   skills/motionboard/recipes/<slug>.md and index.md (source files by relative path, committed)
//   the recipe tables in README.md and README_CN.md between the recipes:start and recipes:end markers
// Two variants of the same recipe text, switched by `skill` in recipeMd(): web and skill.
import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync, existsSync, cpSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { execFileSync } from 'node:child_process'
import coreEn from '../../src/core/messages/en.ts'
import coreZh from '../../src/core/messages/zh.ts'
import { fileURLToPath } from 'node:url'
import { GITHUB_URL, MEDIA_URL, SITE, SITE_URL, SKILL_INSTALL } from '../../src/site/config.ts'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const SKILL_DIR = `skills/${SITE.id}`
const SOURCE_DIR = `${SKILL_DIR}/source`
const REPO = GITHUB_URL

const POSITIONS = {
  open: 'Opening',
  reveal: 'Product reveal',
  feature: 'Features',
  bridge: 'Transitions',
  close: 'Ending',
}
const POSITIONS_ZH = {
  open: '开场',
  reveal: '产品亮相',
  feature: '功能展示',
  bridge: '转场',
  close: '结尾',
}
const POSITION_ORDER = Object.keys(POSITIONS)

const readJson = (p) => JSON.parse(readFileSync(join(ROOT, p), 'utf8'))
const terms = readJson('content/recipes/terms.json')
const en = readJson('content/recipes/en.json')

const order = [...terms].sort(
  (a, b) => POSITION_ORDER.indexOf(a.pos) - POSITION_ORDER.indexOf(b.pos) || a.n - b.n,
)
const bySlug = Object.fromEntries(terms.map((t) => [t.slug, t]))

const seo = Object.fromEntries(
  terms.map((t) => {
    const file = `content/recipes/seo/${t.slug}.json`
    if (!existsSync(join(ROOT, file))) throw new Error(`missing ${file} for recipe "${t.slug}"`)
    return [t.slug, readJson(file)]
  }),
)
const commonName = (t) => seo[t.slug].en.name

// Client data: the index fields with the one-line def, and one text file per recipe and locale.
const GEN_DIR = join(ROOT, 'src/site/data/gen')
const slugByZh = Object.fromEntries(terms.map((t) => [t.zh, t.slug]))
rmSync(GEN_DIR, { recursive: true, force: true })
mkdirSync(join(GEN_DIR, 'text'), { recursive: true })
const gen = (file, data) => writeFileSync(join(GEN_DIR, file), JSON.stringify(data))
gen(
  'index.json',
  terms.map((t) => {
    if (!en[t.slug]) throw new Error(`no en.json entry for "${t.slug}"`)
    const { n, slug, cat, pos, zh, en: name, star, samples, video, dur, zh1 } = t
    return {
      n,
      slug,
      cat,
      pos,
      zh,
      en: name,
      name: { en: seo[slug].en.name, zh: seo[slug].zh.name },
      star,
      samples,
      video,
      dur,
      def: { en: en[t.slug].def, zh: zh1 },
    }
  }),
)
// Search haystack per recipe: names, shot names and the phrases people use for the shot, both languages, lowercased.
// Loaded by the home page search on first use, so it is not part of any page's bundle.
gen(
  'search.json',
  Object.fromEntries(
    terms.map((t) => [
      t.slug,
      [seo[t.slug].en.name, seo[t.slug].zh.name, t.en, t.zh, ...(en[t.slug]?.says || []), ...(t.says || [])].join(' ').toLowerCase(),
    ]),
  ),
)
const pageSeo = ({ title, description, howto, faq }) => ({ title, description, howto, faq })
for (const t of terms) {
  const { def, ...enText } = en[t.slug]
  gen(`text/${t.slug}.en.json`, { ...enText, seo: pageSeo(seo[t.slug].en) })
  gen(`text/${t.slug}.zh.json`, {
    why: t.why,
    spec: t.spec,
    prompt: t.prompt,
    says: t.says,
    // a source reference to a recipe that is not on the site is dropped
    vs: t.vs.flatMap(([zh, text]) => (slugByZh[zh] ? [[slugByZh[zh], text]] : [])),
    seo: pageSeo(seo[t.slug].zh),
  })
}

const encodePath = (p) => p.split('/').map(encodeURIComponent).join('/')
const mdUrl = (slug) => `${SITE_URL}/r/${slug}.md`

// The site serves the source projects from public/source; the skill keeps the originals.
rmSync(join(ROOT, 'public/source'), { recursive: true, force: true })
cpSync(join(ROOT, SOURCE_DIR), join(ROOT, 'public/source'), { recursive: true })

const clock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
const youtube = (id, s) => `https://www.youtube.com/watch?v=${id}${s ? `&t=${s}s` : ''}`

// Length of the film in seconds, from the root composition of the source project
function filmSeconds(video) {
  const html = readFileSync(join(ROOT, SOURCE_DIR, video, 'index.html'), 'utf8')
  const m = html.match(/data-composition-id="main"[^>]*data-duration="([0-9.]+)"/)
  return m ? Number(m[1]) : null
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// Recursive file list, skipping tool state (.hyperframes), dotfiles, renders and node_modules
const SKIP = new Set(['node_modules', 'renders'])
function listFiles(dir, base = '') {
  const out = []
  for (const name of readdirSync(dir).sort()) {
    if (name.startsWith('.') || SKIP.has(name)) continue
    const rel = base ? `${base}/${name}` : name
    const abs = join(dir, name)
    const st = statSync(abs)
    if (st.isDirectory()) out.push(...listFiles(abs, rel))
    else out.push({ path: rel, size: st.size })
  }
  return out
}

const decode = (s) =>
  s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')

// <code>x</code> -> `x`, other tags dropped
function htmlToMd(html) {
  const s = html
    .replace(/<code>([\s\S]*?)<\/code>/g, (_, c) => `\u0000${c}\u0001`)
    .replace(/<br\s*\/?>/g, ' ')
    .replace(/<[^>]+>/g, '')
  return decode(s).replace(/\u0000/g, '`').replace(/\u0001/g, '`')
}
const cell = (s) => s.replace(/\r?\n/g, ' ').replace(/\|/g, '\\|').trim()

const fenceFor = (text) => {
  const runs = text.match(/`+/g) || []
  return '`'.repeat(Math.max(3, ...runs.map((r) => r.length + 1)))
}

function howTo(t, version, skill) {
  const v = version || '<version from package.json>'
  const video = skill
    ? `Copy the folder \`../source/${t.video}/\` (next to this file in the skill) into the user's working folder, for example \`cp -R <skill dir>/source/${t.video} ./${t.video}\`. Adapt \`index.html\` (see "What to adapt").`
    : `Create a folder named \`${t.video}\`. Download every file under "Source files" below with the curl commands, keeping relative paths. Adapt \`index.html\` (see "What to adapt").`
  return `## How to use this recipe

You are a coding agent. The user wants this shot for their own product. Follow these steps.

1. **Know the product.** If the product is clear from the user's repo or conversation, ask nothing and start. Otherwise ask once for: product name, logo file, brand colors.
2. **Pick the output.** If the user's message says a video or their website, do that. Otherwise ask once which one they want.
   - **Video (HyperFrames).** ${video} Run \`npx --yes hyperframes@${v} check\` on the untouched copy first and note its result. Preview with \`npx --yes hyperframes@${v} preview\`, render an MP4 with \`npx --yes hyperframes@${v} render\` (into \`renders/\`, named with a timestamp). The same commands are in \`package.json\` as \`dev\`, \`check\`, \`render\`; pass flags after \`--\`, as in \`npm run render -- --quality draft\`. Rendering needs network access for web fonts and GSAP.
   - **Website motion.** Port the GSAP timeline in \`index.html\` into the user's site, using their stack (React, Vue, Svelte, plain HTML). Build the same DOM structure, keep the timeline's durations, delays and easings exactly, and start it when the element scrolls into view (IntersectionObserver or ScrollTrigger). Respect \`prefers-reduced-motion: reduce\`: show the final frame as a static state and skip the movement.
3. **What to adapt.**
   - **Brand layer** (product name, logo, colors, fonts, copy): replace directly with the user's.
   - **UI layer** (the product screens, cards, windows, controls shown in the shot): rebuild the user's real UI as clean DOM, from their codebase (components, design tokens) or from a screenshot used as reference only. Never paste a screenshot into the shot.
   - **Motion** (timing, easing, camera moves, layering, stagger, order of events): keep exactly as in the source. This is what the recipe is.
   - The timeline targets UI elements by id and class, and camera moves land on fixed coordinates. Keep the ids the timeline uses, keep row counts and text lengths close to the source, and when the layout moves, update the target coordinates without changing the times.
4. **Fonts.** HyperFrames fetches Google Fonts such as Inter on its own. Some sources use macOS local fonts (PingFang, Songti via \`local()\`). Use the user's brand font when it can be bundled; for a system font such as SF Pro, use Inter. Check that text still fits its boxes.
5. **Verify.** Compare the render with the preview ${skill ? 'film on the recipe page' : 'video above'} at the beat times in the Timing row. The beats, timing and camera should match; only brand and UI content differ.`
}

function recipeMd(t, skill) {
  const x = en[t.slug]
  const files = listFiles(join(ROOT, SOURCE_DIR, t.video))
  const pkgFile = files.find((f) => f.path === 'package.json')
  let version = ''
  if (pkgFile) {
    const m = readFileSync(join(ROOT, SOURCE_DIR, t.video, 'package.json'), 'utf8').match(/hyperframes@([0-9][^\s"]*)/)
    if (m) version = m[1]
  }

  const L = []
  L.push(`# ${commonName(t)}`, '')
  if (t.en.toLowerCase() !== commonName(t).toLowerCase()) L.push(`${SITE.name} shot name: ${t.en}`, '')
  if (x?.def) L.push(x.def, '')
  L.push(
    `- Position in a launch film: ${POSITIONS[t.pos]}`,
    `- Slug: ${t.slug}`,
    `- Preview video: ${MEDIA_URL}/${t.video}.mp4`,
    `- Recipe page${skill ? ' (preview film and original side by side)' : ''}: ${SITE_URL}/recipes/${t.slug}/`,
  )
  if (skill) {
    L.push(`- Film length: ${filmSeconds(t.video)}s, 1920x1080`)
    for (const s of t.samples || []) L.push(`- Original reference: ${s.t} (YouTube, ${clock(s.s)}) ${youtube(s.id, s.s)}`)
  } else {
    L.push(`- License: MIT. Free to use in your own projects, including commercial launch films. ${REPO}/blob/main/LICENSE`)
  }
  L.push('', howTo(t, version, skill), '')
  if (skill && x?.says?.length) {
    L.push('## Matches requests like', '', ...x.says.map((s) => `- ${s}`), '')
  }

  if (x?.spec?.length) {
    L.push('## Spec', '', '| Item | Value |', '| --- | --- |')
    for (const [label, val] of x.spec) L.push(`| ${cell(label)} | ${cell(htmlToMd(val))} |`)
    L.push('')
  }
  if (x?.why) L.push('## Why it works', '', x.why, '')
  if (x?.prompt) L.push('## Prompt', '', ...x.prompt.split(/\r?\n/).map((l) => `> ${l}`.trimEnd()), '')
  if (x?.vs?.length) {
    L.push('## Often confused with', '')
    for (const [slug, text] of x.vs) {
      const o = bySlug[slug]
      if (!o) {
        console.warn(`warn: ${t.slug}: vs references unknown slug "${slug}"`)
        continue
      }
      L.push(`- [${commonName(o)}](${skill ? `./${slug}.md` : mdUrl(slug)}): ${text}`)
    }
    L.push('')
  }

  L.push('## Source files', '', `Runnable HyperFrames project, ${files.length} files.`, '')
  if (skill) {
    for (const f of files) L.push(`- ../source/${t.video}/${f.path} (${formatSize(f.size)})`)
    L.push('', `Read \`../source/${t.video}/index.html\` in full before adapting it: it holds the whole composition and its GSAP timeline.`, '')
    return L.join('\n')
  }
  for (const f of files) L.push(`- ${SITE_URL}/source/${t.video}/${encodePath(f.path)} (${formatSize(f.size)})`)
  L.push('', 'Download all of them:', '', '```sh')
  for (const f of files) {
    L.push(`curl -fsSL --create-dirs -o "${t.video}/${f.path}" "${SITE_URL}/source/${t.video}/${encodePath(f.path)}"`)
  }
  L.push('```', '')

  const indexPath = join(ROOT, SOURCE_DIR, t.video, 'index.html')
  if (existsSync(indexPath)) {
    const html = readFileSync(indexPath, 'utf8').replace(/\s+$/, '')
    const fence = fenceFor(html)
    L.push('## index.html', '', `${fence}html`, html, fence, '')
  } else {
    console.warn(`warn: ${t.slug}: ${SOURCE_DIR}/${t.video}/index.html missing`)
  }
  return L.join('\n')
}

const webDir = join(ROOT, 'public/r')
const skillDir = join(ROOT, SKILL_DIR, 'recipes')
for (const d of [webDir, skillDir]) {
  rmSync(d, { recursive: true, force: true })
  mkdirSync(d, { recursive: true })
}

let missing = 0
const built = []
for (const t of order) {
  if (!en[t.slug]) {
    missing++
    console.warn(`warn: no en.json entry for "${t.slug}", text sections skipped`)
  }
  if (!existsSync(join(ROOT, SOURCE_DIR, t.video))) {
    console.warn(`warn: ${SOURCE_DIR}/${t.video}/ missing, skipping ${t.slug}`)
    continue
  }
  writeFileSync(join(webDir, `${t.slug}.md`), recipeMd(t, false))
  writeFileSync(join(skillDir, `${t.slug}.md`), recipeMd(t, true))
  built.push(t)
}

// index.md, web variant
const idx = [`# ${SITE.name} recipes`, '', `${order.length} motion recipes from launch films, grouped by where they sit in a film. Each link is a self-contained instruction file for a coding agent.`, '', `License: MIT. Free to use in your own projects, including commercial launch films. ${REPO}/blob/main/LICENSE`, '']
for (const p of POSITION_ORDER) {
  const group = order.filter((t) => t.pos === p)
  if (!group.length) continue
  idx.push(`## ${POSITIONS[p]}`, '')
  for (const t of group) idx.push(`- [${commonName(t)}](${mdUrl(t.slug)})${en[t.slug]?.def ? `: ${en[t.slug].def}` : ''}`)
  idx.push('')
}
writeFileSync(join(webDir, 'index.md'), idx.join('\n'))

// index.md, skill variant: the list the agent scans to pick shots
const sidx = [
  `# ${SITE.name} recipes`,
  '',
  `${built.length} recipes, grouped by where they sit in a launch film. Each line: English name, slug (the file is \`./<slug>.md\`), what the shot does, film length. Each recipe page on ${SITE_URL} shows the preview film next to the original.`,
  '',
]
for (const p of POSITION_ORDER) {
  const group = built.filter((t) => t.pos === p)
  if (!group.length) continue
  sidx.push(`## ${POSITIONS[p]}`, '')
  for (const t of group) {
    sidx.push(`- **${commonName(t)}** \`${t.slug}\`: ${en[t.slug]?.def || ''} (${filmSeconds(t.video)}s)`)
  }
  sidx.push('')
}
writeFileSync(join(skillDir, 'index.md'), sidx.join('\n'))

// README recipe tables
const mdCell = (s) => cell(s).replace(/`/g, '')
function readmeTable(lang) {
  const zh = lang === 'zh'
  const base = zh ? `${SITE_URL}/zh/recipes` : `${SITE_URL}/recipes`
  const L = []
  for (const p of POSITION_ORDER) {
    const group = built.filter((t) => t.pos === p)
    if (!group.length) continue
    L.push(`### ${zh ? POSITIONS_ZH[p] : POSITIONS[p]} (${group.length})`, '', zh ? '| 配方 | 镜头 |' : '| Recipe | Shot |', '| --- | --- |')
    for (const t of group) {
      L.push(`| [${zh ? seo[t.slug].zh.name : commonName(t)}](${base}/${t.slug}/) | ${mdCell(zh ? t.zh1 || '' : en[t.slug]?.def || '')} |`)
    }
    L.push('')
  }
  return L.join('\n').trimEnd()
}
function writeReadmeTable(file, lang) {
  const path = join(ROOT, file)
  if (!existsSync(path)) return console.warn(`warn: ${file} missing, recipe table skipped`)
  const text = readFileSync(path, 'utf8')
  const start = text.indexOf('<!-- recipes:start -->')
  const end = text.indexOf('<!-- recipes:end -->')
  if (start < 0 || end < start) return console.warn(`warn: ${file} has no recipes:start / recipes:end markers`)
  const next = `${text.slice(0, start)}<!-- recipes:start -->\n\n${readmeTable(lang)}\n\n${text.slice(end)}`
  if (next !== text) writeFileSync(path, next)
}
writeReadmeTable('README.md', 'en')
writeReadmeTable('README_CN.md', 'zh')

// llms.txt, written to gen/ and used by scripts/generate.mjs through src/site/pages.ts
const llms = [
  `# ${SITE.name}`,
  '',
  `> ${SITE.name} is a library of ${order.length} motion recipes broken down from Apple-grade launch films. Each recipe is a 10-second 1920x1080 shot made with code (HyperFrames, HTML and GSAP), with a Markdown file that contains the spec, the prompt and the full runnable source. Give a recipe file to a coding agent such as Claude Code, Codex or Cursor and it recreates the shot for the user's own product, as a video or as motion on a website.`,
  '',
  `License: MIT. Free to use in your own projects, including commercial launch films. ${REPO}/blob/main/LICENSE`,
  '',
  '## Agent skill',
  '',
  `Install the ${SITE.name} skill in Claude Code or Codex and the agent knows all ${order.length} recipes: \`${SKILL_INSTALL}\`. Or tell the agent: "Install this skill: ${REPO}". The skill plans and builds a whole launch film for the user's product, or a single shot. Source: ${REPO}`,
  '',
  '## Recipes',
  '',
  `- [All recipes](${SITE_URL}/r/index.md): the full list grouped by position in a launch film`,
]
for (const t of order) llms.push(`- [${commonName(t)}](${mdUrl(t.slug)})${en[t.slug]?.def ? `: ${en[t.slug].def}` : ''}`)
llms.push('')
writeFileSync(join(GEN_DIR, 'llms.txt'), llms.join('\n'))

// Old recipe files: /r/<old>.md -> /r/<new>.md. The page redirects (/recipes/<old>/ ...) are content/renamed.json.
const renamed = readJson('content/renamed.json')
const redirects = Object.entries(renamed)
  .filter(([from]) => from.startsWith('/recipes/') && from !== '/recipes/')
  .map(([from, to]) => `/r/${from.split('/')[2]}.md /r/${to.split('/')[2]}.md 301`)
writeFileSync(join(GEN_DIR, 'redirects.txt'), `${redirects.join('\n')}\n`)

// Pages for the sitemap: the home page is the template's; recipes, hubs and guides are listed here, with the
// registry fields the template needs (type, lastmod = last commit of the source file, breadcrumb per language).
const HOME = { en: coreEn.page.home, zh: coreZh.page.home }
const lastmod = (...files) => {
  const dates = files.map((f) => execFileSync('git', ['log', '-1', '--format=%cs', '--', f], { cwd: ROOT, encoding: 'utf8' }).trim()).filter(Boolean)
  return dates.sort().at(-1) || new Date().toISOString().slice(0, 10)
}
const crumbs = (path, name) => ({
  en: [{ name: HOME.en, path: '/' }, { name: name.en, path }],
  zh: [{ name: HOME.zh, path: '/' }, { name: name.zh, path }],
})
const pages = [
  ...order.map((t) => {
    const path = `/recipes/${t.slug}/`
    return {
      path,
      type: 'item',
      title: { en: seo[t.slug].en.title, zh: seo[t.slug].zh.title },
      description: { en: seo[t.slug].en.description, zh: seo[t.slug].zh.description },
      // The effect names were picked from search data (task 1), so the name is the page's keyword.
      keyword: { en: seo[t.slug].en.name, zh: seo[t.slug].zh.name },
      lastmod: lastmod(`content/recipes/seo/${t.slug}.json`),
      breadcrumb: crumbs(path, { en: seo[t.slug].en.name, zh: seo[t.slug].zh.name }),
    }
  }),
  ...readdirSync(join(ROOT, 'content/pages'))
    .filter((f) => f.endsWith('.json'))
    .sort()
    .map((f) => {
      const page = readJson(`content/pages/${f}`)
      return {
        path: page.path,
        type: page.path.startsWith('/guides/') ? 'guide' : 'hub',
        title: { en: page.en.title, zh: page.zh.title },
        description: { en: page.en.description, zh: page.zh.description },
        // Hub and guide h1s were written for their search term (task 1).
        keyword: { en: page.en.h1 || page.en.title, zh: page.zh.h1 || page.zh.title },
        lastmod: page.updated || lastmod(`content/pages/${f}`),
        breadcrumb: crumbs(page.path, { en: page.en.h1 || page.en.title, zh: page.zh.h1 || page.zh.title }),
      }
    }),
]
writeFileSync(join(GEN_DIR, 'pages.json'), JSON.stringify(pages))

// Video sitemap: every recipe film, plus the Motionboard skill's showcase films on the launch-video-examples page.
const PUBLISHED = '2026-10-30' // date the recipe films went online
const videos = order.map((t) => ({
  path: `/recipes/${t.slug}/`,
  title: { en: seo[t.slug].en.name, zh: seo[t.slug].zh.name },
  description: { en: seo[t.slug].en.description, zh: seo[t.slug].zh.description },
  thumbnail: `${MEDIA_URL}/${t.video}.jpg`,
  content: `${MEDIA_URL}/${t.video}.mp4`,
  duration: t.dur,
  uploadDate: PUBLISHED,
}))
const showcase = readJson('content/pages/launch-video-examples.json')
for (const b of showcase.en.blocks.filter((b) => b.t === 'showcase')) {
  const zhBlock = showcase.zh.blocks.find((x) => x.t === 'showcase' && x.films[0].video === b.films[0].video)
  for (const f of b.films.filter((f) => f.video.endsWith('-motionboard'))) {
    videos.push({
      path: showcase.path,
      title: { en: `${b.product} launch film by the Motionboard skill`, zh: `${b.product} 宣传片（Motionboard 技能）` },
      description: { en: b.story, zh: zhBlock?.story ?? b.story },
      thumbnail: `${MEDIA_URL}/${f.video}.jpg`,
      content: `${MEDIA_URL}/${f.video}.mp4`,
      duration: f.dur,
      uploadDate: showcase.updated,
    })
  }
}
writeFileSync(join(GEN_DIR, 'videos.json'), JSON.stringify(videos))

console.log(`recipes: wrote ${built.length} recipes x 2 variants (public/r, ${SKILL_DIR}/recipes), index.md, README tables and gen/ (${pages.length} pages, ${videos.length} videos, ${missing} without en.json text) for ${SITE_URL}`)
