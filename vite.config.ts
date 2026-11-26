import { defineConfig, type Plugin } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import mdx from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import remarkGfm from 'remark-gfm'
import { SITE_URL } from './site.config.ts'
import { LOCALES, localizePath, alternateUrls } from './src/core/i18n.ts'
import { contentIndex, hubPagination, indexableLocales, pageLocales, sitePages } from './src/core/pages.ts'
import { sitemapExclude } from './src/site/pages.ts'
import { generate } from './scripts/generate.mjs'

// Writes robots.txt, _redirects, _headers, llms.txt and the video sitemap into public/ before every build and dev start.
// `virtual:content-index`: names and frontmatter of all content files (see contentIndex()).
const contentIndexPlugin = (): Plugin => ({
  name: 'content-index',
  resolveId: (id) => (id === 'virtual:content-index' ? '\0virtual:content-index' : undefined),
  load: (id) => (id === '\0virtual:content-index' ? `export default ${JSON.stringify(contentIndex())}` : undefined),
})

const prebuild = (): Plugin => ({ name: 'prebuild', buildStart: () => generate(), configureServer: () => generate() })

// One entry per page and language it exists in (no fallback: a missing translation is no page). A language the
// quality gate keeps out of the index (or a site's `sitemapExclude`) is prerendered with `sitemap.exclude`. The
// hreflang alternates list only the indexable languages, plus x-default. Pages 2 and up of a paginated hub are
// prerendered and out of the sitemap.
const sitemapPages = sitePages()
const pages = [
  ...sitemapPages.flatMap((p) => {
    const indexable = indexableLocales(p)
    const alternateRefs = alternateUrls(p.path, indexable).map((a) => ({ hreflang: a.lang, href: a.href }))
    return pageLocales(p).map((l) => ({ path: localizePath(l, p.path), sitemap: indexable.includes(l) ? { alternateRefs } : { exclude: true } }))
  }),
  ...hubPagination().flatMap((p) => p.locales.map((l) => ({ path: localizePath(l, p.path), sitemap: { exclude: true } }))),
]

// Paths in a site's `sitemapExclude` are also prerendered without the trailing slash; one that is not a site
// page is prerendered in every language, with and without it.
const excluded = sitemapExclude
  .flatMap((p) => {
    const page = sitemapPages.find((s) => s.path === p)
    const paths = (page ? pageLocales(page) : LOCALES).map((l) => localizePath(l, p))
    return (page ? [] : paths).concat(paths.filter((x) => x.length > 1 && x.endsWith('/')).map((x) => x.slice(0, -1)))
  })
  .map((path) => ({ path, sitemap: { exclude: true } }))

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    prebuild(),
    contentIndexPlugin(),
    { enforce: 'pre', ...mdx({ remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, remarkGfm], providerImportSource: undefined }) },
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tailwindcss(),
    tanstackStart({
      // The page list (sitePages + sitemapExclude) is the single source for prerender and the sitemap: no link
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
      sitemap: { enabled: true, host: SITE_URL },
    }),
    viteReact(),
  ],
})
