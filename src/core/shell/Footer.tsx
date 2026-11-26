import { DEFAULT_LOCALE, localizePath } from '@/core/i18n'
import { useCoreMessages, useShellLocale } from '@/core/messages'
import index from 'virtual:content-index'
import { footerNav, footerNote } from '@/site/nav'
import { SITE } from '../../../site.config.ts'

type FooterLink = { label: string; href: string; external?: boolean; cta?: string }

export function Footer() {
  const l = useShellLocale()
  const m = useCoreMessages()
  // Privacy and Terms appear only when the site has those pages; Contact only with an email address.
  const legal = index.docs.legal[DEFAULT_LOCALE].map((d) => d.slug)
  const links: FooterLink[] = [
    ...footerNav.map((item) => ({ label: item.label[l], href: item.href ?? localizePath(l, item.path ?? '/'), external: !!item.href, cta: item.cta })),
    ...(legal.includes('privacy') ? [{ label: m.footer.privacy, href: localizePath(l, '/privacy/') }] : []),
    ...(legal.includes('terms') ? [{ label: m.footer.terms, href: localizePath(l, '/terms/') }] : []),
    ...(SITE.email ? [{ label: m.footer.contact, href: `mailto:${SITE.email}` }] : []),
  ]
  return (
    <footer className="border-t text-muted-foreground text-sm">
      <div className="mx-auto flex max-w-[var(--site-width,64rem)] flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p>
            © {new Date().getFullYear()} {SITE.name}
          </p>
          {footerNote[l] && <p>{footerNote[l]}</p>}
        </div>
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          {links.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                {...(link.external ? { target: '_blank', rel: 'noopener' } : {})}
                data-cta={link.cta}
                className="underline-offset-4 hover:text-foreground hover:underline"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  )
}
