// Core UI strings of every language in site.config.ts, loaded from src/core/messages/<code>.ts.
import { LOCALES, missingCoreMessages, type Locale } from '../i18n'
import type { CoreMessages } from './en'

const files = import.meta.glob<CoreMessages>(['./*.ts', '!./index.ts'], { eager: true, import: 'default' })

export type { CoreMessages }

/** Strings of each configured language. A language without its file throws an error naming the file to add. */
export const coreMessages = Object.fromEntries(
  LOCALES.map((l) => {
    const messages = files[`./${l}.ts`]
    if (!messages) throw missingCoreMessages(l)
    return [l, messages]
  }),
) as Record<Locale, CoreMessages>
