import { useEffect, useRef, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { burst, writeClipboard } from '@/components/CopyButton'
import { useStrings } from '@/lib/locale'
import { GITHUB_URL, SKILL_INSTALL } from '@/site'

// The skill install command with a copy button; shared by the home page and the recipe pages.
export function InstallCommand() {
  const s = useStrings()
  const btn = useRef<HTMLButtonElement>(null)
  const timer = useRef<number>(0)
  const [done, setDone] = useState(false)

  useEffect(() => () => window.clearTimeout(timer.current), [])

  async function copy() {
    await writeClipboard(SKILL_INSTALL)
    if (btn.current) burst(btn.current)
    setDone(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setDone(false), 1600)
  }

  return (
    <div className="skill-box">
      <code>{SKILL_INSTALL}</code>
      <button ref={btn} type="button" className="btn ghost icon" aria-label={done ? s.actions.copied : s.skill.copy} onClick={copy}>
        {done ? <Check aria-hidden /> : <Copy aria-hidden />}
      </button>
    </div>
  )
}

// The Motionboard skill for Claude Code: the install command and a link to the repo.
export function SkillInstall() {
  const s = useStrings()
  return (
    <section className="skill gut" aria-labelledby="skill-h">
      <div className="wrap">
        <h2 className="skill-h" id="skill-h">
          {s.skill.title}
        </h2>
        <div className="skill-row">
          <InstallCommand />
          <a className="btn ghost" href={GITHUB_URL} target="_blank" rel="noopener">
            {s.skill.github}
          </a>
        </div>
      </div>
    </section>
  )
}
