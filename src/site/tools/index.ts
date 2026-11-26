// Tool widgets used by content/tools/<slug>.json ("tool": "<id>"). Each loads as its own chunk after hydration.
import { lazy, type ComponentType, type LazyExoticComponent } from 'react'
import type { Locale } from '@/core/i18n'

export const tools: Record<string, LazyExoticComponent<ComponentType<{ locale: Locale }>>> = {
  'word-counter': lazy(() => import('./WordCounter')),
}
