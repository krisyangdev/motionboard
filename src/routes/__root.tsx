import type { ReactNode } from 'react'
import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { Analytics } from '@/components/Analytics'
import { Footer, Nav } from '@/components/Chrome'
import { HTML_LANG } from '@/i18n'
import { PageLink, useLocale, useStrings } from '@/lib/locale'
import { StatsProvider } from '@/lib/stats'
import { BRAND } from '@/site'
// All CSS (about 11 KB) is inlined into every page: five separate stylesheets were the main
// render-blocking cost on the home page's mobile Lighthouse run.
import baseCss from '@/styles/base.css?inline'
import actionsCss from '@/styles/actions.css?inline'
import homeCss from '@/styles/home.css?inline'
import entryCss from '@/styles/entry.css?inline'
import pageCss from '@/styles/page.css?inline'

const FONT_FACE =
  "@font-face{font-family:'Instrument Sans';font-style:normal;font-weight:600;font-display:swap;src:url(/fonts/instrument-sans-600-mb.woff2) format('woff2');unicode-range:U+4d,U+61-62,U+64,U+69,U+6e-6f,U+72,U+74}"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
      { name: 'theme-color', content: '#0a0a0b' },
      { title: BRAND.name },
      { name: 'description', content: BRAND.line.en },
      { property: 'og:site_name', content: BRAND.name },
      { property: 'og:locale', content: 'en_US' },
    ],
    links: [
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      // Instrument Sans for the wordmark only, self-hosted and subset to the letters of "Motionboard".
      { rel: 'preload', href: '/fonts/instrument-sans-600-mb.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
    ],
    // The @font-face lives here because Vite rewrites public-folder URLs inside ?inline CSS and fails on them.
    styles: [{ children: FONT_FACE + baseCss + actionsCss + homeCss + entryCss + pageCss }],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
})

function NotFound() {
  const s = useStrings()
  return (
    <main className="gut not-found">
      <h1>{s.notFound.title}</h1>
      <PageLink to={{ page: 'home' }} className="btn">
        {s.notFound.browse}
      </PageLink>
    </main>
  )
}

function RootDocument({ children }: { children: ReactNode }) {
  const locale = useLocale()
  return (
    <html lang={HTML_LANG[locale]}>
      <head>
        <HeadContent />
      </head>
      <body>
        <StatsProvider>
          <Analytics />
          <Nav />
          {children}
          <Footer />
        </StatsProvider>
        <Scripts />
      </body>
    </html>
  )
}
