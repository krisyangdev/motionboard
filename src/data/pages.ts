// Hub and guide pages. The index (PAGES) is eager; the long copy of one page is a separate chunk
// that only that page loads, like loadText in terms.ts.
import type { ContentPage } from './content'

export * from './page-index'

const files = import.meta.glob<ContentPage>('./pages/*.json', { import: 'default' })
export const loadPage = (id: string) => files[`./pages/${id}.json`]()
