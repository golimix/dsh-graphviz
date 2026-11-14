/**
 * Package-local engine chunk: the full `@viz-js/viz` Graphviz build.
 *
 * The main client bundle never imports this module directly; it loads
 * `./client.engine.js` on the first render so the ~1.1 MB WebAssembly build
 * stays out of plugin activation. `dist/client.engine.js` registers this
 * module's exports with the DSH module loader as a package-local chunk.
 */
import { instance, type Viz } from '@viz-js/viz'
import type { EngineChunk, RenderOptions } from '../shared/contract'

let engine: Promise<Viz> | undefined

/**
 * Initialize the WebAssembly engine once; a failed initialization is retried
 * on the next call.
 * @returns a promise for the initialized Viz instance.
 */
function getEngine(): Promise<Viz> {
  if (engine === undefined) {
    engine = instance().catch((error: unknown) => {
      engine = undefined
      throw error
    })
  }
  return engine
}

/**
 * Render DOT source to SVG with the full Graphviz build.
 * @param source - DOT source text.
 * @param options - optional layout engine selection.
 * @returns the raw SVG document.
 * @throws when Graphviz reports a syntax or layout error.
 */
export const renderSvg: EngineChunk['renderSvg'] = async (
  source: string,
  options: RenderOptions = {},
): Promise<string> => {
  const viz = await getEngine()
  return viz.renderString(source, {
    format: 'svg',
    engine: options.engine ?? 'dot',
  })
}
