import { localizePath } from '@/core/i18n'
import { useCoreMessages, useShellLocale } from '@/core/messages'
import { footerNav } from '@/site/nav'
import { SITE } from '../../../site.config.ts'

export function Footer() {
  const l = useShellLocale()
  const m = useCoreMessages()
  const links = [
    ...footerNav.map((item) => ({ label: item.label[l], href: localizePath(l, item.path) })),
    { label: m.footer.privacy, href: localizePath(l, '/privacy/') },
    { label: m.footer.terms, href: localizePath(l, '/terms/') },
    { label: m.footer.contact, href: `mailto:${SITE.email}` },
  ]
  return (
    <footer className="border-t text-muted-foreground text-sm">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © {new Date().getFullYear()} {SITE.name}
        </p>
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          {links.map((link) => (
            <li key={link.href}>
              <a href={link.href} className="underline-offset-4 hover:text-foreground hover:underline">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  )
}
