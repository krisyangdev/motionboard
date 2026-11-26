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
import { contentIndex, pageLocales, sitePages } from './src/core/pages.ts'
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

// One entry per page and language it exists in (no fallback: a missing translation is no page). The hreflang
// alternates list only those languages, plus x-default.
const sitemapPages = sitePages()
const pages = sitemapPages.flatMap((p) => {
  const locales = pageLocales(p)
  const alternateRefs = alternateUrls(p.path, locales).map((a) => ({ hreflang: a.lang, href: a.href }))
  return locales.map((l) => ({ path: localizePath(l, p.path), sitemap: { alternateRefs } }))
})

// Pages the crawler finds through links but that are not search pages (a site's `sitemapExclude`), with and without the trailing slash.
// A path that is also a site page is excluded only in the languages it exists in.
const excluded = sitemapExclude
  .flatMap((p) => {
    const page = sitemapPages.find((s) => s.path === p)
    return (page ? pageLocales(page) : LOCALES).map((l) => localizePath(l, p))
  })
  .flatMap((p) => (p.length > 1 && p.endsWith('/') ? [p, p.slice(0, -1)] : [p]))
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
