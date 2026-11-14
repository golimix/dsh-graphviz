/**
 * Turn raw Graphviz SVG into safe, theme-aware, per-instance markup.
 *
 * Graphviz output is injected with `dangerouslySetInnerHTML`, so this module
 * is the trust boundary: it allowlists SVG elements, drops event handlers and
 * script-capable markup, rejects unsafe URLs, prefixes every id so two diagrams
 * in one conversation cannot collide, and rewrites black strokes and text to
 * host theme tokens so diagrams stay readable in light and dark palettes.
 */

/** SVG namespace. */
const SVG_NS = 'http://www.w3.org/2000/svg'

/** Elements Graphviz may emit and the renderer accepts. */
const ALLOWED_ELEMENTS = new Set([
  'svg',
  'g',
  'a',
  'title',
  'desc',
  'text',
  'tspan',
  'textPath',
  'path',
  'polygon',
  'polyline',
  'ellipse',
  'rect',
  'line',
  'circle',
  'image',
  'defs',
  'linearGradient',
  'radialGradient',
  'stop',
  'clipPath',
  'mask',
  'marker',
  'pattern',
  'use',
  'symbol',
])

/** Named colors relevant to Graphviz output, normalized to lowercase. */
const NAMED_COLORS: Record<string, string> = {
  black: '#000000',
  white: '#ffffff',
  lightgray: '#d3d3d3',
  lightgrey: '#d3d3d3',
  gray: '#808080',
  grey: '#808080',
  whitesmoke: '#f5f5f5',
  ivory: '#fffff0',
  beige: '#f5f5dc',
}

/** Options controlling {@link sanitizeSvg}. */
export interface SanitizeOptions {
  /** Prefix applied to every element id; must start with a letter. */
  idPrefix: string
}

/**
 * Sanitize Graphviz SVG and prepare it for embedding.
 * @param raw - the raw SVG document produced by the engine.
 * @param options - id prefix for this diagram instance.
 * @returns serialized safe SVG markup.
 * @throws when the input is not a well-formed SVG document.
 */
export function sanitizeSvg(raw: string, options: SanitizeOptions): string {
  if (typeof DOMParser === 'undefined') throw new Error('SVG sanitizing needs a DOM')
  const doc = new DOMParser().parseFromString(raw, 'image/svg+xml')
  const parserError = doc.getElementsByTagName('parsererror')[0]
  if (parserError !== undefined) throw new Error('Graphviz returned malformed SVG')
  const root = doc.documentElement
  if (root.namespaceURI !== SVG_NS || root.localName !== 'svg') {
    throw new Error('Graphviz did not return an SVG root')
  }

  cleanChildren(root)
  prefixIds(root, options.idPrefix)
  prepareRoot(root)
  applyThemeColors(root)

  return new XMLSerializer().serializeToString(root)
}

/**
 * Drop non-allowlisted elements, comments, and unsafe attributes recursively.
 * @param parent - element whose subtree is cleaned.
 */
function cleanChildren(parent: Element): void {
  for (const node of [...parent.childNodes]) {
    if (node.nodeType !== 1) {
      if (node.nodeType === 8 || node.nodeType === 7) node.remove()
      continue
    }
    const element = node as Element
    if (!ALLOWED_ELEMENTS.has(element.localName)) {
      element.remove()
      continue
    }
    cleanAttributes(element)
    cleanChildren(element)
  }
}

/**
 * Remove unsafe attributes from one element.
 * @param element - element to inspect.
 */
function cleanAttributes(element: Element): void {
  for (const attribute of [...element.attributes]) {
    const name = attribute.name.toLowerCase()
    const value = attribute.value
    if (name.startsWith('on')) {
      element.removeAttribute(attribute.name)
      continue
    }
    if (name === 'style' && isUnsafeStyle(value)) {
      element.removeAttribute(attribute.name)
      continue
    }
    if (name === 'href' || name === 'src' || name.endsWith(':href')) {
      if (!isSafeUrl(value)) element.removeAttribute(attribute.name)
    }
  }
  if (element.localName === 'a') {
    element.setAttribute('rel', 'noopener noreferrer')
  }
}

/**
 * Reject stylesheet values that can execute script or fetch hidden resources.
 * @param style - the style attribute value.
 * @returns true when the value must be dropped.
 */
function isUnsafeStyle(style: string): boolean {
  return /expression\s*\(|javascript\s*:|vbscript\s*:|behavior\s*:|@import|url\s*\(\s*['"]?\s*(?:javascript|vbscript|file|data)\s*:/i.test(
    style,
  )
}

/**
 * Accept only link/image targets that cannot run script.
 * @param url - the attribute value.
 * @returns true when the URL is allowed.
 */
function isSafeUrl(url: string): boolean {
  const compact = url.replace(/[\u0000-\u0020]/g, '').toLowerCase()
  if (/^(?:javascript|vbscript|file|about):/.test(compact)) return false
  if (compact.startsWith('data:')) {
    return /^data:image\/(?:png|jpe?g|gif|webp|svg\+xml)[;,]/i.test(compact)
  }
  return true
}

/**
 * Rename every id with the instance prefix and rewrite internal references.
 * @param root - the root element.
 * @param prefix - instance prefix.
 */
function prefixIds(root: Element, prefix: string): void {
  const elements = [root, ...root.querySelectorAll('*')]
  const renamed = new Map<string, string>()
  for (const element of elements) {
    const id = element.getAttribute('id')
    if (id === null || id === '') continue
    const next = `${prefix}${id}`
    renamed.set(id, next)
    element.setAttribute('id', next)
  }
  if (renamed.size === 0) return
  for (const element of elements) {
    for (const attribute of [...element.attributes]) {
      const rewritten = rewriteReferences(attribute.value, renamed)
      if (rewritten !== attribute.value) element.setAttribute(attribute.name, rewritten)
    }
  }
}

/**
 * Rewrite `url(#id)` and `href="#id"` references through the id map.
 * @param value - an attribute value.
 * @param renamed - old id to prefixed id.
 * @returns the rewritten value.
 */
function rewriteReferences(value: string, renamed: Map<string, string>): string {
  const withUrls = value.replace(/url\(\s*(['"]?)#([^'")\s]+)\1\s*\)/g, (match, quote: string, id: string) => {
    const next = renamed.get(id)
    return next === undefined ? match : `url(${quote}#${next}${quote})`
  })
  if (withUrls.startsWith('#') && renamed.has(withUrls.slice(1))) {
    return `#${renamed.get(withUrls.slice(1))}`
  }
  return withUrls
}

/**
 * Normalize the root for responsive layout: keep the viewBox, drop fixed
 * dimensions, and mark the SVG as an image for assistive technology.
 * @param root - the root SVG element.
 */
function prepareRoot(root: Element): void {
  const width = root.getAttribute('width')
  const height = root.getAttribute('height')
  if (root.getAttribute('viewBox') === null && width !== null && height !== null) {
    const w = Number.parseFloat(width)
    const h = Number.parseFloat(height)
    if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
      root.setAttribute('viewBox', `0 0 ${w} ${h}`)
    }
  }
  root.removeAttribute('width')
  root.removeAttribute('height')
  root.setAttribute('preserveAspectRatio', 'xMidYMid meet')
  root.setAttribute('role', 'img')
  root.setAttribute('class', mergeClass(root.getAttribute('class'), 'dsh-gv-svg'))
}

/**
 * Append a class name without dropping existing ones.
 * @param current - existing class attribute, if any.
 * @param name - class to append.
 * @returns the merged class value.
 */
function mergeClass(current: string | null, name: string): string {
  if (current === null || current.trim() === '') return name
  return current.includes(name) ? current : `${current} ${name}`
}

/**
 * Map Graphviz's black ink to host theme tokens while keeping explicit colors.
 * @param root - the root SVG element.
 */
function applyThemeColors(root: Element): void {
  for (const element of [root, ...root.querySelectorAll('*')]) {
    if (element.localName === 'text' || element.localName === 'tspan' || element.localName === 'textPath') {
      const fill = element.getAttribute('fill')
      if (fill !== null && !isBlack(fill)) continue
      const background = nearestFill(element)
      const onLight = background !== null && luminance(background) > 0.6
      setStyle(element, 'fill', onLight ? '#111827' : 'var(--dsw-alias-label-primary, #111827)')
      continue
    }
    if (isBlack(element.getAttribute('fill'))) {
      setStyle(element, 'fill', 'var(--dsw-alias-label-primary, #111827)')
    }
    if (isBlack(element.getAttribute('stroke'))) {
      setStyle(element, 'stroke', 'var(--dsw-alias-label-primary, #111827)')
    }
  }
}

/**
 * Find the nearest painted fill behind a text node.
 * @param element - the text element.
 * @returns a normalized light/dark color, or null when none is painted.
 */
function nearestFill(element: Element): string | null {
  let current: Element | null = element.parentElement
  while (current !== null) {
    const fill = current.getAttribute('fill')
    if (fill !== null && fill.trim() !== '' && fill.toLowerCase() !== 'none' && fill.toLowerCase() !== 'transparent') {
      return normalizeColor(fill)
    }
    current = current.parentElement
  }
  return null
}

/**
 * Check whether a color value is Graphviz's default black ink.
 * @param value - fill or stroke value.
 * @returns true for black and its equivalents.
 */
function isBlack(value: string | null): boolean {
  if (value === null) return false
  const normalized = normalizeColor(value)
  return normalized === '#000000' || normalized === '#111827'
}

/**
 * Normalize a CSS color to `#rrggbb` when it is a common form.
 * @param value - color text.
 * @returns a normalized color, or the input text when unknown.
 */
function normalizeColor(value: string): string {
  const text = value.trim().toLowerCase()
  if (NAMED_COLORS[text] !== undefined) return NAMED_COLORS[text] as string
  if (text.startsWith('#')) {
    if (/^#[0-9a-f]{3}$/.test(text)) {
      const [r, g, b] = [text[1], text[2], text[3]] as [string, string, string]
      return `#${r}${r}${g}${g}${b}${b}`
    }
    if (/^#[0-9a-f]{6}$/.test(text)) return text
    return text
  }
  const rgb = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/.exec(text)
  if (rgb !== null) {
    const [, r = '0', g = '0', b = '0'] = rgb
    return `#${Number(r).toString(16).padStart(2, '0')}${Number(g).toString(16).padStart(2, '0')}${Number(b).toString(16).padStart(2, '0')}`
  }
  return text
}

/**
 * Estimate perceived brightness of a normalized color.
 * @param color - normalized color text.
 * @returns luminance in the 0–1 range, or 0 for unknown values.
 */
function luminance(color: string): number {
  if (!/^#[0-9a-f]{6}$/.test(color)) return 0
  const r = Number.parseInt(color.slice(1, 3), 16)
  const g = Number.parseInt(color.slice(3, 5), 16)
  const b = Number.parseInt(color.slice(5, 7), 16)
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255
}

/**
 * Add or replace one CSS declaration in an element's inline style.
 * @param element - target element.
 * @param property - CSS property name.
 * @param value - CSS value.
 */
function setStyle(element: Element, property: 'fill' | 'stroke', value: string): void {
  const existing = element.getAttribute('style') ?? ''
  const without = existing
    .split(';')
    .filter((part) => part.trim() !== '' && !new RegExp(`^\\s*${property}\\s*:`, 'i').test(part))
    .map((part) => part.trim())
  without.push(`${property}:${value}`)
  element.setAttribute('style', `${without.join(';')};`)
}
