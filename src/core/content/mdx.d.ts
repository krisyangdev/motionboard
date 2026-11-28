declare module '*.mdx' {
  import type { ComponentType } from 'react'
  export const frontmatter: import('./schema').DocFrontmatter
  const MDXContent: ComponentType<{ components?: Record<string, ComponentType<any>> }>
  export default MDXContent
}

declare module 'virtual:content-index' {
  const index: import('../pages').ContentIndex
  export default index
}

declare module 'virtual:content-lists' {
  const lists: import('../pages').ContentLists
  export default lists
}

declare module 'virtual:content-collections' {
  const collections: Record<string, () => Promise<import('./collection').CollectionModule>>
  export default collections
}
