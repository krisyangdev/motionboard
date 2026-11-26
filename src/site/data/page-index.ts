// The hub and guide pages, as a small list every page can import (footer links, sitemap in
// vite.config.ts). The long copy is content/pages/<id>.json, loaded per page by pages.ts.
// Kept free of import.meta.glob so vite.config.ts can load it in Node.
export type PageKind = 'hub' | 'guide'

export type PageEntry = {
  id: string
  kind: PageKind
  /** English path with leading and trailing slash; Chinese pages add the /zh prefix */
  path: string
  /** short name for footer links and breadcrumbs */
  label: { en: string; zh: string }
}

const hub = (id: string, en: string, zh: string): PageEntry => ({ id, kind: 'hub', path: `/${id}/`, label: { en, zh } })
const guide = (id: string, en: string, zh: string): PageEntry => ({ id, kind: 'guide', path: `/guides/${id}/`, label: { en, zh } })

export const PAGES: PageEntry[] = [
  hub('logo-animation', 'Logo animation', 'Logo 动画'),
  hub('transitions', 'Transitions', '转场'),
  hub('text-animation', 'Text animation', '文字动画'),
  hub('ui-animation', 'UI animation', 'UI 动画'),
  hub('product-reveal', 'Product reveal', '产品亮相'),
  guide('can-claude-make-videos', 'Can Claude make videos?', 'Claude 能做视频吗？'),
  guide('hyperframes-vs-remotion', 'HyperFrames vs Remotion', 'HyperFrames vs Remotion'),
  guide('claude-code-video-skills', 'Claude Code video skills', 'Claude Code 视频 skill'),
  guide('product-launch-video-with-claude-code', 'Launch video with Claude Code', '用 Claude Code 做宣传片'),
  guide('launch-video-examples', 'Launch video examples', '宣传片示例'),
]
