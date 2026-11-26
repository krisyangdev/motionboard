import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import { SITE_URL } from './site.config'

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    cloudflare({ viteEnvironment: { name: 'ssr' } }),
    tailwindcss(),
    tanstackStart({
      prerender: { enabled: true, crawlLinks: true, failOnError: true, filter: ({ path }) => !path.includes('#') && !/\.\w+\/?$/.test(path) },
      pages: [{ path: '/' }, { path: '/zh/' }],
      sitemap: { enabled: true, host: SITE_URL },
    }),
    viteReact(),
  ],
})
