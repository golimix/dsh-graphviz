/**
 * Runtime contract shared by the Host entry, the Client entry, the engine
 * chunk, and the tests. This module stays free of DOM and Node APIs so every
 * side can import it.
 */

/** Package id; also the prefix of every slot registration id. */
export const PACKAGE_ID = '@local/dsh-graphviz'

/** Chat slot that wraps a Markdown fence. */
export const FENCE_SLOT = 'conversation.chat.markdown.fence'

/** Fence languages this bundle takes over. */
export const FENCE_KEYS = ['dot', 'graphviz', 'gv'] as const

/** One supported fence language. */
export type FenceKey = (typeof FENCE_KEYS)[number]

/** Client locale namespace owned by this bundle. */
export const LOCALE_NS = 'graphviz'

/** Package-local engine chunk requested through the module loader's `require.async`. */
export const ENGINE_CHUNK = './client.engine.js'

/** Layout engines accepted by the renderer. */
export type GraphvizEngine = 'dot'

/** Options forwarded to the Graphviz engine. */
export interface RenderOptions {
  /** Layout engine; the bundle ships the full build but only exposes `dot`. */
  engine?: GraphvizEngine
}

/** The exports of `dist/client.engine.js`. */
export interface EngineChunk {
  /**
   * Render DOT source to an SVG document.
   * @param source - DOT language source.
   * @param options - optional engine selection.
   * @returns the raw Graphviz SVG output.
   * @throws when the source is invalid or the engine fails.
   */
  renderSvg(source: string, options?: RenderOptions): Promise<string>
}
