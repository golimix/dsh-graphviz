/** Engine chunk loader behavior. */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { loadEngine, resetEngineLoader } from '../client/engine-loader'

const chunk = { renderSvg: vi.fn(async () => '<svg/>') }

describe('loadEngine', () => {
  beforeEach(() => resetEngineLoader())

  it('resolves the chunk and memoizes it', async () => {
    const loader = vi.fn(async () => chunk)
    const first = await loadEngine(loader)
    const second = await loadEngine(loader)
    expect(first).toBe(chunk)
    expect(second).toBe(chunk)
    expect(loader).toHaveBeenCalledTimes(1)
    expect(loader).toHaveBeenCalledWith('./client.engine.js')
  })

  it('rejects a chunk without renderSvg', async () => {
    const loader = vi.fn(async () => ({ nope: true }))
    await expect(loadEngine(loader)).rejects.toThrow(/renderSvg/)
  })

  it('clears the cache after failure so the next call retries', async () => {
    const loader = vi
      .fn()
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(chunk)
    await expect(loadEngine(loader)).rejects.toThrow(/network down/)
    await expect(loadEngine(loader)).resolves.toBe(chunk)
    expect(loader).toHaveBeenCalledTimes(2)
  })

  it('reports a missing module loader', async () => {
    await expect(loadEngine(undefined)).rejects.toThrow(/module loader/)
  })
})
