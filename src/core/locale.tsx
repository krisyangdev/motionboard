// React side of i18n: the current locale comes from the optional `{-$locale}` route param.
import { useParams } from '@tanstack/react-router'
import { localeParam, paramLocale, type Locale } from './i18n'

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
