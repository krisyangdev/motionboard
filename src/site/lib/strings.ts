import { useMessages } from '@/core/locale'
import { messages } from '@/site/messages'

/** UI strings of the current language. */
export const useStrings = () => useMessages(messages)
