import { Moon, Sun } from 'lucide-react'
import { useCoreMessages } from '@/core/messages'
import { setTheme } from '@/core/theme'
import { Button } from '@/core/ui/button'

// Both icons are always rendered and `dark:` classes pick one, so server and client markup match
// even though the theme is only known in the browser.
export function ThemeToggle() {
  const m = useCoreMessages()
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={m.theme.toggle}
      onClick={() => setTheme(document.documentElement.classList.contains('dark') ? 'light' : 'dark')}
    >
      <Sun className="hidden dark:block" />
      <Moon className="dark:hidden" />
    </Button>
  )
}
