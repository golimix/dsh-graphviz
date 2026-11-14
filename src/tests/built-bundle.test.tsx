/** End-to-end check of the built artifacts: loader registration, lazy chunk, render. */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import * as React from 'react'
import * as jsxRuntime from 'react/jsx-runtime'

interface Registration {
  id: string
  chunk?: string
  factory: (require: LoaderRequire) => unknown
}

interface LoaderRequire {
  (specifier: string): unknown
  async: (specifier: string) => Promise<unknown>
  asset?: (reference: string) => string
}

/** Read one built artifact from the package's dist directory. */
function artifact(name: string): string {
  return readFileSync(join(process.cwd(), 'dist', name), 'utf8')
}

/**
 * Execute a factory bundle against the current window.
 * @param code - built script text.
 * @param registrations - registration sink.
 */
function execute(code: string, registrations: Registration[]): void {
  const target = window as unknown as {
    __ModuleLoader__?: { load: (registration: Registration) => void }
  }
  target.__ModuleLoader__ = {
    load: (registration) => {
      registrations.push(registration)
    },
  }
  new Function('window', code)(target)
}

/**
 * Build a module-table require that resolves React and the package's engine chunk.
 * @param registrations - captured factory registrations.
 * @returns the loader require handed to the client factory.
 */
function moduleRequire(registrations: Registration[]): { require: LoaderRequire; asyncCalls: () => number } {
  const loaded = new Map<string, unknown>()
  let asyncCalls = 0
  const load = (specifier: string): unknown => {
    if (loaded.has(specifier)) return loaded.get(specifier)
    if (specifier === 'react') return React
    if (specifier === 'react/jsx-runtime') return jsxRuntime
    throw new Error(`unexpected external "${specifier}"`)
  }
  const require = load as LoaderRequire
  require.async = async (specifier: string) => {
    asyncCalls += 1
    if (specifier !== './client.engine.js') throw new Error(`unexpected chunk "${specifier}"`)
    const cacheKey = 'engine'
    if (loaded.has(cacheKey)) return loaded.get(cacheKey)
    execute(artifact('client.engine.js'), registrations)
    const chunk = registrations.find((entry) => entry.chunk === 'client.engine.js')
    if (chunk === undefined) throw new Error('engine chunk did not register')
    const exports = chunk.factory(require)
    loaded.set(cacheKey, exports)
    return exports
  }
  return { require, asyncCalls: () => asyncCalls }
}

describe('built bundle', () => {
  it('registers three fence layers and renders a real Graphviz SVG through the lazy chunk', async () => {
    const registrations: Registration[] = []
    execute(artifact('client.js'), registrations)
    const main = registrations.find((entry) => entry.id === '@local/dsh-graphviz' && entry.chunk === undefined)
    expect(main).toBeDefined()
    if (main === undefined) return

    const { require, asyncCalls } = moduleRequire(registrations)
    const exports = main.factory(require) as { inject: string[]; apply: (ctx: unknown) => void }
    expect(exports.inject).toEqual(['slots', 'locale'])

    let component: React.ComponentType<{ code: string; streaming?: boolean; children?: React.ReactNode }> | undefined
    const slots: unknown[] = []
    const ctx = {
      effect: (effect: () => unknown) => {
        effect()
      },
      locale: { register: () => () => undefined, bind: () => (key: string) => key },
      slots: {
        inject: (_name: string, register: () => unknown) => register(),
        register: (options: unknown, componentType: typeof component) => {
          slots.push(options)
          component = componentType
          return () => undefined
        },
      },
    }
    exports.apply(ctx)
    expect(slots).toHaveLength(3)

    // Answer Monaco from the global so the integration test never touches the CDN.
    const editor = {
      getValue: () => '',
      setValue: () => undefined,
      onDidChangeModelContent: () => undefined,
      layout: () => undefined,
      focus: () => undefined,
      dispose: () => undefined,
    }
    const monaco = {
      editor: { create: () => editor, setTheme: () => undefined },
      languages: {
        register: () => undefined,
        setMonarchTokensProvider: () => undefined,
        registerCompletionItemProvider: () => undefined,
        CompletionItemKind: { Keyword: 1, Property: 2, Reference: 3 },
        CompletionItemInsertTextRule: { InsertAsSnippet: 1 },
      },
    }
    ;(window as unknown as { monaco?: unknown }).monaco = monaco

    const Fence = component as React.ComponentType<{ code: string }> | undefined
    expect(Fence).toBeDefined()
    if (Fence === undefined) return
    // Nothing may request the engine chunk before a fence actually renders.
    expect(asyncCalls()).toBe(0)
    const { container } = render(React.createElement(Fence, { code: 'digraph { alpha -> beta }' }))
    await waitFor(
      () => expect(container.querySelector('.dsh-gv-canvas svg')).toBeTruthy(),
      { timeout: 15_000 },
    )
    expect(container.querySelector('.dsh-gv-canvas')?.textContent).toContain('alpha')
    expect(asyncCalls()).toBe(1)
    expect(screen.getByTestId('dsh-gv')).toBeTruthy()

    // A second diagram reuses the already loaded engine chunk.
    const second = render(React.createElement(Fence, { code: 'graph { x -- y }' }))
    await waitFor(
      () => expect(second.container.querySelector('.dsh-gv-canvas svg')).toBeTruthy(),
      { timeout: 15_000 },
    )
    expect(asyncCalls()).toBe(1)
  }, 30_000)
})
