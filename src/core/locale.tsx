// React side of i18n: the current locale comes from the optional `{-$locale}` route param.
import { useLocation, useMatches, useParams } from '@tanstack/react-router'
import { coreMessages } from './messages'
import { localeOf, localeParam, paramLocale, type Locale } from './i18n'

export function useLocale(): Locale {
  const { locale } = useParams({ strict: false }) as { locale?: string }
  return paramLocale(locale)
}

/** `{-$locale}` param value for links that stay in the current language. */
export const useLocaleParam = () => localeParam(useLocale())

/** Pick the current locale's entry of a per-locale dictionary. */
export function useMessages<T>(dict: Record<Locale, T>): T {
  return dict[useLocale()]
}

/**
 * Locale of the page being shown, read from the URL. The shell also renders on 404 pages, where the
 * `{-$locale}` route param is not available, so it cannot rely on useLocale().
 */
export function useShellLocale(): Locale {
  return localeOf(useLocation().pathname)
}

/** Core UI strings (shell, page templates, sign-in and account pages) in the current language. */
export const useCoreMessages = () => coreMessages[useShellLocale()]

/**
 * Languages the page being shown exists in: the `locales` field of the loader data of a content route
 * (tool, guide, legal, hub), or undefined for a page that exists in every language.
 */
export function usePageLocales(): readonly Locale[] | undefined {
  return useMatches({ select: (matches) => (matches.at(-1)?.loaderData as { locales?: readonly Locale[] } | undefined)?.locales })
}
