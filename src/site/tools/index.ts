// Motionboard has no tool pages; the template's ToolPage still imports this registry.
import type { ComponentType, LazyExoticComponent } from 'react'
import type { Locale } from '@/core/i18n'

export const tools: Record<string, LazyExoticComponent<ComponentType<{ locale: Locale }>>> = {}
