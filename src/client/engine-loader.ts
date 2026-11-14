/** Load the Graphviz engine chunk through the DSH module loader. */
import { ENGINE_CHUNK, type EngineChunk } from '../shared/contract'

/** The module loader's asynchronous chunk operation. */
export type ChunkLoader = (specifier: string) => Promise<unknown>

/**
 * Read the injected lazy-CJS `require.async` from the plugin factory scope.
 * @returns the loader function, or undefined outside the DSH client.
 */
function injectedLoader(): ChunkLoader | undefined {
  if (typeof require !== 'function') return undefined
  const candidate = require as { async?: (specifier: string) => Promise<unknown> }
  if (typeof candidate.async !== 'function') return undefined
  return (specifier) => candidate.async!(specifier)
}

/**
 * Check the chunk's export shape before anyone renders with it.
 * @param value - resolved chunk exports.
 * @returns true when the export exposes `renderSvg`.
 */
function isEngineChunk(value: unknown): value is EngineChunk {
  if (typeof value !== 'object' || value === null) return false
  return typeof (value as { renderSvg?: unknown }).renderSvg === 'function'
}

let pending: Promise<EngineChunk> | undefined

/**
 * Load and memoize the engine chunk. A failed load clears the cache so the
 * next render can retry.
 * @param loader - chunk loader; defaults to the injected module-loader `require.async`.
 * @returns the engine chunk exports.
 * @throws when the loader is unavailable, the chunk fails, or its shape is wrong.
 */
export function loadEngine(loader: ChunkLoader | undefined = injectedLoader()): Promise<EngineChunk> {
  if (pending !== undefined) return pending
  if (loader === undefined) {
    return Promise.reject(new Error('dsh-graphviz: the DSH client module loader is unavailable'))
  }
  pending = loader(ENGINE_CHUNK)
    .then((chunk) => {
      if (!isEngineChunk(chunk)) {
        throw new Error('dsh-graphviz: client.engine.js did not export renderSvg')
      }
      return chunk
    })
    .catch((error: unknown) => {
      pending = undefined
      throw error instanceof Error ? error : new Error(String(error))
    })
  return pending
}

/**
 * Drop the memoized chunk so tests can start from a clean loader.
 * @returns nothing.
 */
export function resetEngineLoader(): void {
  pending = undefined
}
