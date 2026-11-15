import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { cloudflare } from '@cloudflare/vite-plugin'
import terms from './src/data/terms.json'
import { PAGES } from './src/data/page-index'
import { SITE_URL } from './src/site'

// A page in both locales with its hreflang alternates (same URLs as alternates() in src/lib/seo.ts,
// which cannot be imported here: it pulls in import.meta.glob data).
const indexed = (path: string) => {
  const alternateRefs = [
    { hreflang: 'en', href: `${SITE_URL}${path}` },
    { hreflang: 'zh-CN', href: `${SITE_URL}/zh${path}` },
    { hreflang: 'x-default', href: `${SITE_URL}${path}` },
  ]
  return ['', '/zh'].map((prefix) => ({ path: `${prefix}${path}`, sitemap: { alternateRefs } }))
}

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tanstackStart({
      // Every page is prerendered to static HTML and served as a static asset; links to
      // static files (recipe .md, media) are not pages.
      prerender: { enabled: true, crawlLinks: true, failOnError: true, filter: ({ path }) => !path.includes('#') && !/\.\w+\/?$/.test(path) },
      pages: [
        // English at the root, Chinese mirrored under /zh/.
        ...indexed('/'),
        ...terms.flatMap((t) => indexed(`/recipes/${t.slug}/`)),
        ...PAGES.flatMap((p) => indexed(p.path)),
        // Found by the crawler but not search pages: the personal saved list, an in-page
        // anchor, and the recipe files written for agents (listed in llms.txt instead).
        ...['/saved', '/saved/', '/#recipes', '/zh/saved', '/zh/saved/', '/zh/#recipes', ...terms.map((t) => `/r/${t.slug}.md`)].map((path) => ({
          path,
          sitemap: { exclude: true },
        })),
      ],
      sitemap: { enabled: true, host: SITE_URL },
    }),
    viteReact(),
  ],
})
