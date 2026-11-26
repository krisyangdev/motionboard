// Internal links that stay in the current language. The `{-$locale}` param is undefined for English.
import { useCallback, type MouseEventHandler, type ReactNode, type Ref } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { useLocaleParam } from '@/core/locale'

type LinkProps = {
  className?: string
  ref?: Ref<HTMLAnchorElement>
  onClick?: MouseEventHandler<HTMLAnchorElement>
  viewTransition?: boolean
  'aria-label'?: string
  'data-tile-title'?: boolean
  children?: ReactNode
}

export function RecipeLink({ slug, ...rest }: LinkProps & { slug: string }) {
  return <Link to="/{-$locale}/recipes/$slug/" params={{ locale: useLocaleParam(), slug }} {...rest} />
}

/** The home page, optionally at a hash such as `recipes`. */
export function HomeLink({ hash, ...rest }: LinkProps & { hash?: string }) {
  return <Link to="/{-$locale}/" params={{ locale: useLocaleParam() }} hash={hash} {...rest} />
}

export function SavedLink(props: LinkProps) {
  return <Link to="/{-$locale}/saved/" params={{ locale: useLocaleParam() }} {...props} />
}

/** Client-side navigation to a recipe page in the current language. */
export function useGoToRecipe() {
  const navigate = useNavigate()
  const locale = useLocaleParam()
  return useCallback((slug: string) => navigate({ to: '/{-$locale}/recipes/$slug/', params: { locale, slug } }), [navigate, locale])
}
