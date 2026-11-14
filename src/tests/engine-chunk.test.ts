/** Real render through the full @viz-js/viz engine chunk. */
import { describe, expect, it } from 'vitest'
import { renderSvg } from '../client/engine-chunk'

describe('engine chunk', () => {
  it('renders DOT to SVG with Graphviz', async () => {
    const svg = await renderSvg('digraph G { rankdir=LR; A -> B -> C; }')
    expect(svg).toContain('<svg')
    expect(svg).toContain('</svg>')
    expect(svg).not.toContain('digraph G')
  }, 30_000)

  it('surfaces Graphviz syntax errors', async () => {
    await expect(renderSvg('digraph G { A -> }')).rejects.toThrow()
  }, 30_000)
})
