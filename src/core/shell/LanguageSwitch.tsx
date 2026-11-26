import { useLocation } from '@tanstack/react-router'
import { HTML_LANG, LOCALES, localizePath, stripLocale } from '@/core/i18n'
import { languageNames, useCoreMessages, useShellLocale } from '@/core/messages'
import { buttonVariants } from '@/core/ui/button'

// Plain links to the same page in the other languages. Full page loads keep the markup static.
export function LanguageSwitch() {
  const current = useShellLocale()
  const path = stripLocale(useLocation().pathname)
  const m = useCoreMessages()
  return (
    <>
      {LOCALES.filter((l) => l !== current).map((l) => (
        <a
          key={l}
          href={localizePath(l, path)}
          hrefLang={HTML_LANG[l]}
          lang={HTML_LANG[l]}
          aria-label={`${m.language}: ${languageNames[l]}`}
          className={buttonVariants({ variant: 'ghost', size: 'sm' })}
        >
          {languageNames[l]}
        </a>
      ))}
    </>
  )
}
