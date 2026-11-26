// Local fake used when MOCK_GENERATION is 'true': returns an SVG showing the prompt after a short
// delay, and fails on purpose when the prompt contains "fail" so refunds can be exercised.
import type { GenerationProvider } from './types'

const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function wrap(text: string, width: number, maxLines: number): string[] {
  const lines: string[] = []
  let line = ''
  for (const word of text.split(/\s+/).filter(Boolean)) {
    // Break very long words (and CJK text without spaces) so they stay inside the picture.
    for (let rest = word; rest.length > 0; rest = rest.slice(width)) {
      const chunk = rest.slice(0, width)
      if (line && line.length + 1 + chunk.length > width) {
        lines.push(line)
        line = chunk
      } else {
        line = line ? `${line} ${chunk}` : chunk
      }
    }
  }
  if (line) lines.push(line)
  if (lines.length > maxLines) {
    lines.length = maxLines
    lines[maxLines - 1] = `${lines[maxLines - 1]!.slice(0, width - 1)}…`
  }
  return lines
}

export const mockProvider: Pick<GenerationProvider, 'run'> = {
  async run(input) {
    await new Promise((resolve) => setTimeout(resolve, 800))
    if (input.prompt.toLowerCase().includes('fail')) throw new Error('Mock provider failed on purpose')

    let hash = 0
    for (const ch of input.prompt) hash = (hash * 31 + ch.codePointAt(0)!) >>> 0
    const hue = hash % 360
    const lines = wrap(input.prompt, 26, 10)
    const startY = 256 - ((lines.length - 1) * 30) / 2
    const text = lines
      .map((l, i) => `<text x="256" y="${startY + i * 30}" text-anchor="middle" dominant-baseline="middle">${escapeXml(l)}</text>`)
      .join('')
    const body =
      `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">` +
      `<rect width="512" height="512" fill="hsl(${hue} 55% 38%)"/>` +
      `<g fill="#fff" font-family="system-ui, sans-serif" font-size="24">${text}</g></svg>`
    return { body, contentType: 'image/svg+xml', ext: 'svg' }
  },
}
