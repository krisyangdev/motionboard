declare module '*.mdx' {
  import type { ComponentType } from 'react'
  export const frontmatter: { title: string; description: string; date: string; updated?: string }
  const MDXContent: ComponentType<{ components?: Record<string, ComponentType<any>> }>
  export default MDXContent
}
