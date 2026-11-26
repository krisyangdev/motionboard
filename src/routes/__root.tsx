import type { ReactNode } from 'react'
import { createRootRoute, useParams } from '@tanstack/react-router'
import { Head, Scripts } from '@/core/Scripts'
import css from '@/site/styles.css?inline'

const FONT_FACE =
  "@font-face{font-family:'Inter';font-style:normal;font-weight:100 900;font-display:swap;src:url(/fonts/inter-latin.woff2) format('woff2');unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}"
const THEME = `(()=>{try{const t=localStorage.getItem('theme');if(t==='dark'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch{}})()`

export const Route = createRootRoute({
  head: () => ({
    meta: [{ charSet: 'utf-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1' }, { title: 'Site Template' }],
    links: [{ rel: 'preload', href: '/fonts/inter-latin.woff2', as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' }],
    styles: [{ children: FONT_FACE + css }],
  }),
  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: ReactNode }) {
  const { locale } = useParams({ strict: false }) as { locale?: string }
  return (
    <html lang={locale === 'zh' ? 'zh-CN' : 'en'} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME }} />
        <Head />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
