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
import { sitePages } from './src/core/pages.ts'
import { generate } from './scripts/generate.mjs'

// Writes robots.txt, _redirects, _headers, llms.txt and the video sitemap into public/ before every build and dev start.
const prebuild = (): Plugin => ({ name: 'prebuild', buildStart: () => generate(), configureServer: () => generate() })

const pages = sitePages().flatMap((p) =>
  LOCALES.map((l) => ({
    path: localizePath(l, p.path),
    sitemap: { alternateRefs: alternateUrls(p.path).map((a) => ({ hreflang: a.lang, href: a.href })) },
  })),
)

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    prebuild(),
    { enforce: 'pre', ...mdx({ remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter, remarkGfm], providerImportSource: undefined }) },
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tailwindcss(),
    tanstackStart({
      prerender: { enabled: true, crawlLinks: true, failOnError: true, filter: ({ path }) => !path.includes('#') && !/\.\w+\/?$/.test(path) },
      pages,
      sitemap: { enabled: true, host: SITE_URL },
    }),
    viteReact(),
  ],
})
