import { defineConfig, type Plugin } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import mdx from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import remarkGfm from 'remark-gfm'
import { LOCALES, localizePath } from './src/core/i18n.ts'
import { collectionIds, collectionItems, contentIndex, contentLists, hubPagination, pageLocales, sitePages } from './src/core/pages.ts'
import { sitemapExclude } from './src/site/pages.ts'
import { generate } from './scripts/generate.mjs'

// Writes robots.txt, _redirects, _headers, llms.txt, the sitemaps and feed.xml into public/ before every build and dev start.
// Content registry modules (src/core/pages.ts): `virtual:content-index` (every page: page existence, hub names),
// `virtual:content-lists` (tools and docs with descriptions), `virtual:content-collections` (one lazy import per
// collection) and `virtual:content-collection/<id>` (that collection's items and a lazy import per item file).
const CONTENT = 'virtual:content-'
const contentIndexPlugin = (): Plugin => ({
  name: 'content-index',
  resolveId: (id) => (id.startsWith(CONTENT) ? `\0${id}` : undefined),
  load: (id) => {
    if (!id.startsWith(`\0${CONTENT}`)) return undefined
    const name = id.slice(1 + CONTENT.length)
    if (name === 'index') return `export default ${JSON.stringify(contentIndex())}`
    if (name === 'lists') return `export default ${JSON.stringify(contentLists())}`
    if (name === 'collections') return `export default {${collectionIds().map((c) => `${JSON.stringify(c)}: () => import(${JSON.stringify(`${CONTENT}collection/${c}`)})`).join(',')}}`
    const c = name.slice('collection/'.length)
    const items = collectionItems(c)
    const files = items.map((i) => `${JSON.stringify(i.slug)}: () => import(${JSON.stringify(`/content/collections/${c}/${i.slug}.json`)}).then((m) => m.default)`)
    return `export const items = ${JSON.stringify(items)}\nexport const files = {${files.join(',')}}`
  },
})

const prebuild = (): Plugin => ({ name: 'prebuild', buildStart: () => generate(), configureServer: () => generate() })

// One prerendered path per page and language it exists in (no fallback: a missing translation is no page), plus pages 2
// and up of the paginated hubs. The sitemaps are not made here: scripts/generate.mjs writes them from the same page list
// (src/core/seo/sitemaps.ts), listing only the indexable languages.
const sitemapPages = sitePages()
const pages = [
  ...sitemapPages.flatMap((p) => pageLocales(p).map((l) => ({ path: localizePath(l, p.path) }))),
  ...hubPagination().flatMap((p) => p.locales.map((l) => ({ path: localizePath(l, p.path) }))),
]

// Paths in a site's `sitemapExclude` (noindex pages, which sitePages() already lists) are also prerendered without the
// trailing slash; one that is not a site page is prerendered in every language, with and without it.
const excluded = sitemapExclude
  .flatMap((p) => {
    const page = sitemapPages.find((s) => s.path === p)
    const paths = (page ? pageLocales(page) : LOCALES).map((l) => localizePath(l, p))
    return (page ? [] : paths).concat(paths.filter((x) => x.length > 1 && x.endsWith('/')).map((x) => x.slice(0, -1)))
  })
  .map((path) => ({ path }))

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    prebuild(),
    contentIndexPlugin(),
    { enforce: 'pre', ...mdx({ remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, remarkGfm], providerImportSource: undefined }) },
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tailwindcss(),
    tanstackStart({
      // The page list (sitePages + sitemapExclude) is the single source for prerender and the sitemaps: no link
      // crawling and no automatic static-route discovery, so private routes (admin, account, app) are never
      // prerendered or listed. Paths with a file extension or a '#' are static files or anchors, not pages.
      // scripts/test.mjs checks that every internal link points at a listed page or a private path.
      prerender: {
        enabled: true,
        crawlLinks: false,
        autoStaticPathsDiscovery: false,
        failOnError: true,
        filter: ({ path }) => !path.includes('#') && !/\.\w+\/?$/.test(path),
      },
      pages: [...pages, ...excluded],
    }),
    viteReact(),
  ],
})
