import { cn } from '@/core/lib/utils'
import { localizePath } from '@/core/i18n'
import { useShellLocale } from '@/core/messages'
import { buttonVariants } from '@/core/ui/button'

const label = { en: 'Sign in', zh: '登录' }

// A plain link with no session lookup: the account page shows the signed-in state, or sends the visitor on to login.
export function AccountLink() {
  const l = useShellLocale()
  return (
    <a href={localizePath(l, '/account/')} className={cn(buttonVariants({ variant: 'ghost' }), 'text-muted-foreground')}>
      {label[l]}
    </a>
  )
}
