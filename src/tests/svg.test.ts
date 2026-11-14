/** Sanitizer, theming, and id-isolation tests. */
import { describe, expect, it } from 'vitest'
import { sanitizeSvg } from '../client/svg'

/** A Graphviz-shaped document with a gradient, link, and malicious payload. */
const sample = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="120pt" height="80pt" viewBox="0 0 120 80">
  <defs>
    <linearGradient id="grad"><stop offset="0" stop-color="#fff"/></linearGradient>
  </defs>
  <g id="graph0" class="graph" onclick="steal()">
    <title>G</title>
    <polygon fill="white" stroke="black" points="0,0 10,0 10,10"/>
    <g id="node1" class="node">
      <title>a</title>
      <ellipse fill="none" stroke="black" cx="10" cy="10" rx="5" ry="5"/>
      <text x="10" y="12" font-family="Times,serif" font-size="14.00">a</text>
    </g>
    <a xlink:href="https://example.com" target="_blank"><text x="20" y="20">safe</text></a>
    <a xlink:href="javascript:alert(1)"><text x="30" y="30">bad</text></a>
    <script>alert(1)</script>
    <foreignObject width="10" height="10"><body xmlns="http://www.w3.org/1999/xhtml">x</body></foreignObject>
    <polygon fill="url(#grad)" points="0,0 1,0 1,1"/>
  </g>
</svg>`

describe('sanitizeSvg', () => {
  it('keeps Graphviz markup while removing script-capable content', () => {
    const svg = sanitizeSvg(sample, { idPrefix: 'gv1-' })
    expect(svg).not.toContain('<script')
    expect(svg).not.toContain('foreignObject')
    expect(svg).not.toContain('onclick')
    expect(svg).not.toContain('javascript:')
    expect(svg).toContain('https://example.com')
    expect(svg).toContain('rel="noopener noreferrer"')
  })

  it('drops fixed root dimensions and keeps a responsive viewBox', () => {
    const svg = sanitizeSvg(sample, { idPrefix: 'gv1-' })
    expect(svg).not.toMatch(/<svg[^>]*\swidth=/)
    expect(svg).not.toMatch(/<svg[^>]*\sheight=/)
    expect(svg).toContain('viewBox="0 0 120 80"')
    expect(svg).toContain('preserveAspectRatio="xMidYMid meet"')
    expect(svg).toContain('role="img"')
    expect(svg).toContain('dsh-gv-svg')
  })

  it('prefixes ids and rewrites internal references', () => {
    const svg = sanitizeSvg(sample, { idPrefix: 'gv1-' })
    expect(svg).toContain('id="gv1-graph0"')
    expect(svg).toContain('id="gv1-grad"')
    expect(svg).toContain('url(#gv1-grad)')
  })

  it('isolates ids between diagram instances', () => {
    const first = sanitizeSvg(sample, { idPrefix: 'gv1-' })
    const second = sanitizeSvg(sample, { idPrefix: 'gv2-' })
    expect(first).toContain('id="gv1-node1"')
    expect(second).toContain('id="gv2-node1"')
  })

  it('maps black ink to theme tokens and picks readable text on light fills', () => {
    const svg = sanitizeSvg(sample, { idPrefix: 'gv1-' })
    expect(svg).toContain('var(--dsw-alias-label-primary, #111827)')
    expect(svg).toContain('#111827')
  })

  it('rejects malformed SVG', () => {
    expect(() => sanitizeSvg('<svg><g></svg>', { idPrefix: 'gv-' })).toThrow(/malformed|SVG/)
    expect(() => sanitizeSvg('<html><body/></html>', { idPrefix: 'gv-' })).toThrow(/SVG root/)
  })
})
