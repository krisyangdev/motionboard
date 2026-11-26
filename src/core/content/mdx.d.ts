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
