import type { Locale } from '../../site.config.ts'

type Feature = { title: string; body: string }

export const messages: Record<Locale, { hero: { title: string; lede: string; tools: string; guides: string }; features: Feature[] }> = {
  en: {
    hero: {
      title: 'A fast, bilingual site starter',
      lede: 'React, TanStack Start and coss ui, prerendered and served from Cloudflare Workers.',
      tools: 'Browse tools',
      guides: 'Read guides',
    },
    features: [
      { title: 'Prerendered', body: 'Every page is static HTML built ahead of time. The app JavaScript loads after the first paint.' },
      { title: 'English and Chinese', body: 'The default language lives at the root and the others under a prefix, with hreflang links on every page.' },
      { title: 'SEO built in', body: 'Titles, canonical URLs, Open Graph tags, JSON-LD and the sitemap all come from one function.' },
      { title: 'Fast first paint', body: 'CSS is inlined and the hero renders before any script runs, which keeps mobile PageSpeed above 99.' },
      { title: 'coss ui', body: 'Accessible Base UI components styled with Tailwind, copied into the repository so you own them.' },
      { title: 'Cloudflare Workers', body: 'One config file and one deploy command put the site on static hosting around the world.' },
    ],
  },
  zh: {
    hero: {
      title: '快速的双语站点起点',
      lede: 'React、TanStack Start 和 coss ui，预渲染后部署在 Cloudflare Workers 上。',
      tools: '浏览工具',
      guides: '阅读指南',
    },
    features: [
      { title: '预渲染', body: '每个页面都是提前生成的静态 HTML，应用的 JavaScript 在首屏绘制之后才加载。' },
      { title: '中英双语', body: '默认语言放在根路径，其他语言放在前缀下，每个页面都带 hreflang 链接。' },
      { title: '内置 SEO', body: '标题、规范链接、Open Graph 标签、JSON-LD 和站点地图都由同一个函数生成。' },
      { title: '快速首屏', body: 'CSS 内联，主视觉在任何脚本运行之前就已渲染，移动端 PageSpeed 保持在 99 分以上。' },
      { title: 'coss ui', body: '基于 Base UI 的无障碍组件，用 Tailwind 设置样式，代码复制进仓库，由你自己掌控。' },
      { title: 'Cloudflare Workers', body: '一个配置文件、一条部署命令，就把站点放到全球的静态托管上。' },
    ],
  },
}
