// Inline text of the content pages: [label](url) links and `code`, nothing else.
import type { ReactNode } from 'react'
import { SiteLink } from '@/site/components/page/SiteLink'

const TOKEN = /\[([^\]]+)\]\(([^)\s]+)\)|`([^`]+)`/g

/** The text without its markup, for JSON-LD */
export const plain = (text: string) => text.replace(TOKEN, (_, label, _url, code) => label ?? code)

export const linkClass = 'text-link underline underline-offset-3 hover:text-primary-hover'

// Outbound links the stats count: GitHub and skills.sh.
const CTA: Record<string, string> = { 'github.com': 'github', 'skills.sh': 'skills.sh' }

function Anchor({ href, children }: { href: string; children: ReactNode }) {
  if (/^https?:\/\//.test(href)) {
    return (
      <a href={href} target="_blank" rel="noopener" data-cta={CTA[new URL(href).hostname]} className={linkClass}>
        {children}
      </a>
    )
  }
  // Pages get the locale prefix; files (recipe .md, media) and in-page anchors do not.
  if (href.startsWith('/') && !/\.\w+$/.test(href.split('#')[0])) {
    return (
      <SiteLink href={href} className={linkClass}>
        {children}
      </SiteLink>
    )
  }
  return (
    <a href={href} className={linkClass}>
      {children}
    </a>
  )
}

const code = 'rounded-md bg-surface-2 px-1.5 py-px font-mono text-[0.85em] text-foreground [overflow-wrap:anywhere]'

export function Inline({ text }: { text: string }) {
  const out: ReactNode[] = []
  let last = 0
  for (const m of text.matchAll(TOKEN)) {
    if (m.index > last) out.push(text.slice(last, m.index))
    out.push(
      m[1] === undefined ? (
        <code key={m.index} className={code}>
          {m[3]}
        </code>
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
