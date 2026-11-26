import type { ReactNode } from 'react'
import { createRootRoute } from '@tanstack/react-router'
import { Analytics } from '@/core/Analytics'
import { HTML_LANG } from '@/core/i18n'
import { useShellLocale } from '@/core/messages'
import { Head, Scripts } from '@/core/Scripts'
import { Footer } from '@/core/shell/Footer'
import { Header } from '@/core/shell/Header'
import { NotFound } from '@/core/shell/NotFound'
import { THEME_SCRIPT } from '@/core/theme'
import css from '@/site/styles.css?inline'
import { SITE } from '../../site.config.ts'

const FONT_FACE =
  "@font-face{font-family:'Inter';font-style:normal;font-weight:100 900;font-display:swap;src:url(/fonts/inter-latin.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}" +
  // Local Arial scaled to Inter's metrics, so the swap to Inter moves no text (no layout shift).
  "@font-face{font-family:'Inter Fallback';src:local('Arial');ascent-override:90.49%;descent-override:22.56%;line-gap-override:0%;size-adjust:107.06%}"

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      // head() keeps one meta per name, so the light theme-color is written in RootDocument.
      { name: 'theme-color', content: '#161616', media: '(prefers-color-scheme: dark)' },
      { title: SITE.title.en },
      { name: 'description', content: SITE.description.en },
    ],
    links: [
      { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
      { rel: 'preload', href: '/fonts/inter-latin.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' },
    ],
    // The @font-face lives here because Vite rewrites public-folder URLs inside ?inline CSS and fails on them.
    styles: [{ children: FONT_FACE + css }],
  }),
  shellComponent: RootDocument,
  notFoundComponent: NotFound,
})

function RootDocument({ children }: { children: ReactNode }) {
  const locale = useShellLocale()
  return (
    <html lang={HTML_LANG[locale]} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <Head />
        <meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)" />
      </head>
      <body className="flex min-h-screen flex-col">
        <Header />
        <div id="main" className="flex-1">
          {children}
        </div>
        <Footer />
        <Analytics />
        <Scripts />
      </body>
    </html>
  )
}
