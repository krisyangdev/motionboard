import { useLocation } from '@tanstack/react-router'
import { cn } from '@/core/lib/utils'
import { localizePath, stripLocale } from '@/core/i18n'
import { useCoreMessages, useShellLocale } from '@/core/messages'
import { buttonVariants } from '@/core/ui/button'
import { SITE } from '../../../site.config.ts'
import { nav } from '@/site/nav'
import { AccountLink } from './AccountLink'
import { LanguageSwitch } from './LanguageSwitch'
import { ThemeToggle } from './ThemeToggle'

// Visible only while focused; the target is the #main wrapper in __root.tsx.
function SkipLink() {
  const m = useCoreMessages()
  return (
    <a
      href="#main"
      className="sr-only rounded-lg bg-background px-3 py-2 font-medium text-sm focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:ring-2 focus:ring-ring"
    >
      {m.skipLink}
    </a>
  )
}

// On narrow screens the nav drops to its own row below and scrolls sideways, so no JS menu is needed.
export function Header() {
  const l = useShellLocale()
  const m = useCoreMessages()
  const path = stripLocale(useLocation().pathname)
  return (
    <header className="border-b">
      <SkipLink />
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-2 px-4 py-2 sm:flex-nowrap">
        <a href={localizePath(l, '/')} className="mr-2 font-semibold text-brand text-lg tracking-tight">
          {SITE.name}
        </a>
        <nav
          aria-label={m.nav}
          className="order-last -mx-4 w-full overflow-x-auto px-4 [scrollbar-width:none] sm:order-none sm:mx-0 sm:w-auto sm:flex-1 sm:px-0"
        >
          <ul className="flex gap-1">
            {nav.map((item) => (
              <li key={item.path}>
                <a
                  href={localizePath(l, item.path)}
                  aria-current={path.startsWith(item.path) ? 'page' : undefined}
                  className={cn(buttonVariants({ variant: 'ghost' }), 'text-muted-foreground aria-[current=page]:text-foreground')}
                >
                  {item.label[l]}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <LanguageSwitch />
          {SITE.accounts.enabled && <AccountLink />}
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
