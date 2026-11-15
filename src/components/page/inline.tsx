// Inline text of the content pages: [label](url) links and `code`, nothing else.
import type { ReactNode } from 'react'
import { SiteLink } from '@/components/page/SiteLink'

const TOKEN = /\[([^\]]+)\]\(([^)\s]+)\)|`([^`]+)`/g

/** The text without its markup, for JSON-LD */
export const plain = (text: string) => text.replace(TOKEN, (_, label, _url, code) => label ?? code)

function Anchor({ href, children }: { href: string; children: ReactNode }) {
  if (/^https?:\/\//.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener">
        {children}
      </a>
    )
  }
  // Pages get the locale prefix; files (recipe .md, media) and in-page anchors do not.
  if (href.startsWith('/') && !/\.\w+$/.test(href.split('#')[0])) return <SiteLink href={href}>{children}</SiteLink>
  return <a href={href}>{children}</a>
}

export function Inline({ text }: { text: string }) {
  const out: ReactNode[] = []
  let last = 0
  for (const m of text.matchAll(TOKEN)) {
    if (m.index > last) out.push(text.slice(last, m.index))
    out.push(
      m[1] === undefined ? (
        <code key={m.index}>{m[3]}</code>
      ) : (
        <Anchor key={m.index} href={m[2]}>
          {m[1]}
        </Anchor>
      ),
    )
    last = m.index + m[0].length
  }
  out.push(text.slice(last))
  return <>{out}</>
}
