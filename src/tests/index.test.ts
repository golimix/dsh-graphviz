/** Plugin entry registration: slots, ids, locale, and style lifetime. */
import { beforeEach, describe, expect, it, vi } from 'vitest'
vi.mock('../client/styles.css', () => ({ default: '.dsh-gv{}' }))

import { apply, inject } from '../client/index'
import type { ClientContext } from '../client/dsh'

/**
 * Build a context double that records registrations.
 * @returns the context and recorded calls.
 */
function contextDouble(): {
  ctx: ClientContext
  registered: { name: string; key?: string; id?: string; locale?: string }[]
  previews: { id: string; extensions: readonly string[]; priority?: string; loading: string }[]
  effects: string[]
  cleanups: (() => void)[]
} {
  const registered: { name: string; key?: string; id?: string; locale?: string }[] = []
  const previews: { id: string; extensions: readonly string[]; priority?: string; loading: string }[] = []
  const effects: string[] = []
  const cleanups: (() => void)[] = []
  const ctx: ClientContext = {
    documentPreviews: {
      register: (definition) => {
        previews.push({ id: definition.id, extensions: definition.extensions, priority: definition.priority, loading: definition.loading })
        return () => undefined
      },
    },
    effect: (effect, label) => {
      effects.push(label ?? '')
      const cleanup = effect()
      if (typeof cleanup === 'function') cleanups.push(cleanup)
    },
    locale: {
      register: vi.fn(() => () => undefined),
      bind: vi.fn(() => (key: string) => key),
    },
    slots: {
      inject: (_name, register) => {
        register()
      },
      register: (options) => {
        registered.push(options)
        return () => undefined
      },
    },
  }
  return { ctx, registered, previews, effects, cleanups }
}

describe('client entry', () => {
  beforeEach(() => {
    document.querySelectorAll('style[data-plugin="@limix/dsh-graphviz"]').forEach((node) => node.remove())
  })

  it('declares the services it needs', () => {
    expect(inject).toEqual(['slots', 'locale', 'documentPreviews'])
  })

  it('registers one layer per fence language with stable ids', () => {
    const { ctx, registered } = contextDouble()
    apply(ctx)
    const fences = registered.filter((entry) => entry.name === 'conversation.chat.markdown.fence')
    expect(fences.map((entry) => entry.key)).toEqual(['dot', 'graphviz', 'gv'])
    expect(fences.map((entry) => entry.id)).toEqual([
      '@limix/dsh-graphviz/fence/dot',
      '@limix/dsh-graphviz/fence/graphviz',
      '@limix/dsh-graphviz/fence/gv',
    ])
    for (const entry of fences) {
      expect(entry.locale).toBe('graphviz')
    }
  })

  it('registers the dot document renderer', () => {
    const { ctx, registered, previews } = contextDouble()
    apply(ctx)
    expect(previews).toEqual([{
      id: '@limix/dsh-graphviz/document/dot',
      extensions: ['dot'],
      priority: 'extension',
      loading: 'text-pages',
    }])
    expect(registered.map((entry) => entry.name)).toContain('sidebar.right.tab.document')
    const body = registered.find((entry) => entry.name === 'sidebar.right.tab.document')
    expect(body?.key).toBe('@limix/dsh-graphviz/document/dot')
    expect(body?.locale).toBe('documentDot')
  })

  it('registers locale dictionaries and styles as owned effects', () => {
    const { ctx, effects, cleanups } = contextDouble()
    apply(ctx)
    expect(effects).toEqual([
      'dsh-graphviz: dictionaries',
      'dsh-graphviz: styles',
      'dsh-graphviz: document dictionaries',
      'dsh-graphviz: document preview',
    ])
    expect(document.querySelectorAll('style[data-plugin="@limix/dsh-graphviz"]')).toHaveLength(1)
    for (const cleanup of cleanups) cleanup()
    expect(document.querySelectorAll('style[data-plugin="@limix/dsh-graphviz"]')).toHaveLength(0)
  })
})
