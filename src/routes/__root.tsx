import { useEffect, type ReactNode } from 'react'
import { createRootRoute, useLocation } from '@tanstack/react-router'
import { Analytics } from '@/core/Analytics'
import { DEFAULT_LOCALE, DIR, HTML_LANG } from '@/core/i18n'
import { useShellLocale } from '@/core/locale'
import { Head, Scripts } from '@/core/Scripts'
import { Footer } from '@/core/shell/Footer'
import { Header } from '@/core/shell/Header'
import { NotFound } from '@/core/shell/NotFound'
import { fontCss, fontPreloads, themeColorMetas } from '@/core/head'
import { THEME_SCRIPT } from '@/core/theme'
import css from '@/site/styles.css?inline'
import { SITE } from '../../site.config.ts'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: SITE.title[DEFAULT_LOCALE] },
      { name: 'description', content: SITE.description[DEFAULT_LOCALE] },
    ],
    links: [
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'alternate', type: 'application/rss+xml', title: SITE.name, href: '/feed.xml' },
      ...fontPreloads(SITE.fonts),
    ],
    // The @font-face lives here because Vite rewrites public-folder URLs inside ?inline CSS and fails on them.
    styles: [{ children: fontCss(SITE.fonts) + css }],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
})

function RootDocument({ children }: { children: ReactNode }) {
  const locale = useShellLocale()
  // /admin is an internal tool: no site chrome, no page analytics.
  const admin = useLocation({ select: (l) => l.pathname.startsWith('/admin') })
  // Set once React has hydrated; end-to-end tests wait for it before interacting.
  useEffect(() => {
    document.documentElement.setAttribute('data-hydrated', '')
  }, [])
  return (
    <html lang={HTML_LANG[locale]} dir={DIR[locale]} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <Head />
        {/* Written here because head() keeps one meta per name. */}
        {themeColorMetas(SITE.theme).map((m) => (
          <meta key={m.content + (m.media ?? '')} {...m} />
        ))}
      </head>
      <body className="flex min-h-screen flex-col">
        {!admin && <Header />}
        <div id="main" className="flex-1">
          {children}
        </div>
        {!admin && <Footer />}
        {!admin && <Analytics />}
        <Scripts />
      </body>
    </html>
  )
}
