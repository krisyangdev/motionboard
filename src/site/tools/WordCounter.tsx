import { useMemo, useState } from 'react'
import type { Locale } from '@/core/i18n'

const text = {
  en: { label: 'Your text', placeholder: 'Type or paste your text here', words: 'Words', characters: 'Characters', noSpaces: 'No spaces', reading: 'Reading time', under: '< 1 min', min: 'min' },
  zh: { label: '你的文本', placeholder: '在这里输入或粘贴文本', words: '词数', characters: '字符数', noSpaces: '不含空格', reading: '阅读时间', under: '不到 1 分钟', min: '分钟' },
}

const HAN = /\p{Script=Han}/gu
const segmenters = new Map<Locale, Intl.Segmenter>()

function count(value: string, locale: Locale) {
  let segmenter = segmenters.get(locale)
  if (!segmenter) segmenters.set(locale, (segmenter = new Intl.Segmenter(locale, { granularity: 'word' })))
  let words = 0
  for (const s of segmenter.segment(value)) if (s.isWordLike) words++
  const han = value.match(HAN)?.length ?? 0
  return {
    words,
    characters: [...value].length,
    noSpaces: [...value.replace(/\s/g, '')].length,
    // 238 words per minute for alphabetic text, 400 characters per minute for Chinese.
    minutes: (words - han) / 238 + han / 400,
  }
}

export default function WordCounter({ locale }: { locale: Locale }) {
  const t = text[locale]
  const [value, setValue] = useState('')
  const c = useMemo(() => count(value, locale), [value, locale])
  const stats: [string, string][] = [
    [t.words, String(c.words)],
    [t.characters, String(c.characters)],
    [t.noSpaces, String(c.noSpaces)],
    [t.reading, c.words === 0 ? '0' : c.minutes < 1 ? t.under : `${Math.round(c.minutes)} ${t.min}`],
  ]
  return (
    <div className="flex min-h-[22rem] flex-col gap-4">
      <span className="relative inline-flex w-full flex-1 rounded-lg border border-input bg-background not-dark:bg-clip-padding text-base shadow-xs/5 ring-ring/24 transition-shadow has-focus-visible:border-ring has-focus-visible:ring-[3px] sm:text-sm dark:bg-input/32">
        <textarea
          aria-label={t.label}
          className="min-h-48 w-full resize-none rounded-[inherit] bg-transparent px-[calc(--spacing(3)-1px)] py-[calc(--spacing(2)-1px)] text-foreground outline-none placeholder:text-muted-foreground/72"
          onChange={(e) => setValue(e.target.value)}
          placeholder={t.placeholder}
          value={value}
        />
      </span>
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(([label, number]) => (
          <div className="rounded-lg bg-muted px-3 py-2" key={label}>
            <dt className="text-xs text-muted-foreground">{label}</dt>
            <dd className="text-lg font-semibold tabular-nums">{number}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
