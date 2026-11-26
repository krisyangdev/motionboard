import { useState } from 'react'
import { useMessages } from '@/core/locale'
import { messages } from '@/site/messages'

const codePoints = (s: string) => [...s].map((c) => `U+${c.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}`).join(' ')

/** The symbols of an item as tiles: the symbol itself is in the HTML; a click copies it. */
export function CopyTiles({ symbols }: { symbols: readonly string[] }) {
  const m = useMessages(messages).symbols
  const [copied, setCopied] = useState('')
  return (
    <div className="mt-8">
      <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6">
        {symbols.map((s) => (
          <li key={s}>
            <button
              aria-label={`${m.copy} ${s}`}
              className="flex w-full flex-col items-center rounded-lg border bg-card py-3 outline-none hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring"
              onClick={() => {
                void navigator.clipboard?.writeText(s)
                setCopied(s)
              }}
              type="button"
            >
              <span className="text-2xl">{s}</span>
              <span className="mt-1 text-[10px] text-muted-foreground">{codePoints(s)}</span>
            </button>
          </li>
        ))}
      </ul>
      <p aria-live="polite" className="mt-2 min-h-5 text-sm text-muted-foreground">
        {copied && `${m.copied} ${copied}`}
      </p>
    </div>
  )
}
