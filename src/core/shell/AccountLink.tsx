import { cn } from '@/core/lib/utils'
import { localizePath } from '@/core/i18n'
import { useCoreMessages, useShellLocale } from '@/core/locale'
import { buttonVariants } from '@/core/ui/button'

// A plain link with no session lookup: the account page shows the signed-in state, or sends the visitor on to login.
export function AccountLink() {
  const l = useShellLocale()
  const m = useCoreMessages()
  return (
    <a href={localizePath(l, '/account/')} className={cn(buttonVariants({ variant: 'ghost' }), 'text-muted-foreground')}>
      {m.signIn}
    </a>
  )
}
