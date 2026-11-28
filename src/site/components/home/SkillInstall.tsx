import { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { track } from '@/core/track'
import { Button, buttonVariants } from '@/core/ui/button'
import { burst, writeClipboard } from '@/site/components/CopyButton'
import { GITHUB_URL, SITE, SKILL_INSTALL } from '@/site/config'
import { useStrings } from '@/site/lib/strings'

// The skill install command with a copy button; shared by the home page, the recipe pages and the guides.
export function CommandBox({ text, what }: { text: string; what: 'install' | 'command' }) {
  const s = useStrings()
  const btn = useRef<HTMLButtonElement>(null)
  const timer = useRef<number>(0)
  const [done, setDone] = useState(false)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  async function copy() {
    await writeClipboard(text)
    track('copy', { tool: SITE.id, what, page: location.pathname })
    if (btn.current) burst(btn.current)
    setDone(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setDone(false), 1600)
  }

  return (
    <div className="flex w-full max-w-full min-w-0 items-center gap-1 rounded-2xl bg-card py-0 pr-1 pl-4 shadow-soft sm:w-fit">
      <code className="min-w-0 flex-1 py-2.5 font-mono text-[0.8125rem] [overflow-wrap:anywhere] sm:text-sm">{text}</code>
      <Button ref={btn} variant="ghost" size="icon-lg" className="text-muted-foreground hover:text-foreground" aria-label={done ? s.actions.copied : s.skill.copy} onClick={copy}>
        {done ? <Check aria-hidden /> : <Copy aria-hidden />}
      </Button>
    </div>
  )
}

export const InstallCommand = () => <CommandBox text={SKILL_INSTALL} what="install" />

// The Motionboard skill for Claude Code: the install command and a link to the repo.
export function SkillInstall() {
  const s = useStrings()
  return (
    <section className="wrap pt-4 pb-16 md:pb-24" aria-labelledby="skill-h">
      <div className="rounded-card bg-step p-5 md:p-8">
        <h2 className="mb-4 text-[22px] leading-[1.2] md:text-[26px]" id="skill-h">
          {s.skill.title}
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <InstallCommand />
          <a className={buttonVariants({ variant: 'outline', size: 'lg', className: 'max-sm:w-full' })} href={GITHUB_URL} target="_blank" rel="noopener" data-cta="github">
            {s.skill.github}
          </a>
        </div>
      </div>
    </section>
  )
}
