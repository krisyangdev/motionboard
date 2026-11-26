import { useLocation } from '@tanstack/react-router'
import { HTML_LANG, LOCALES, localeMeta, localizePath, stripLocale } from '@/core/i18n'
import { useCoreMessages, usePageLocales, useShellLocale } from '@/core/locale'
import { buttonVariants } from '@/core/ui/button'

// Plain links to the other languages: the same page where it exists in that language, else that language's home.
// Full page loads keep the markup static.
export function LanguageSwitch() {
  const current = useShellLocale()
  const path = stripLocale(useLocation().pathname)
  const pageLocales = usePageLocales()
  const m = useCoreMessages()
  return (
    <>
      {LOCALES.filter((l) => l !== current).map((l) => {
        const name = localeMeta(l).name
        return (
          <a
            key={l}
            href={localizePath(l, !pageLocales || pageLocales.includes(l) ? path : '/')}
            hrefLang={HTML_LANG[l]}
            lang={HTML_LANG[l]}
            aria-label={`${m.language}: ${name}`}
            className={buttonVariants({ variant: 'ghost', size: 'sm' })}
          >
            {name}
          </a>
        )
      })}
    </>
  )
}
