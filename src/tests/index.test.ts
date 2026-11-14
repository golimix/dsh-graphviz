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
  registered: { name: string; key?: string; id: string; locale?: string }[]
  effects: string[]
  cleanups: (() => void)[]
} {
  const registered: { name: string; key?: string; id: string; locale?: string }[] = []
  const effects: string[] = []
  const cleanups: (() => void)[] = []
  const ctx: ClientContext = {
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
  return { ctx, registered, effects, cleanups }
}

describe('client entry', () => {
  beforeEach(() => {
    document.querySelectorAll('style[data-plugin="@local/dsh-graphviz"]').forEach((node) => node.remove())
  })

  it('declares the services it needs', () => {
    expect(inject).toEqual(['slots', 'locale'])
  })

  it('registers one layer per fence language with stable ids', () => {
    const { ctx, registered } = contextDouble()
    apply(ctx)
    expect(registered.map((entry) => entry.key)).toEqual(['dot', 'graphviz', 'gv'])
    expect(registered.map((entry) => entry.id)).toEqual([
      '@local/dsh-graphviz/fence/dot',
      '@local/dsh-graphviz/fence/graphviz',
      '@local/dsh-graphviz/fence/gv',
    ])
    for (const entry of registered) {
      expect(entry.name).toBe('conversation.chat.markdown.fence')
      expect(entry.locale).toBe('graphviz')
    }
  })

  it('registers locale dictionaries and styles as owned effects', () => {
    const { ctx, effects, cleanups } = contextDouble()
    apply(ctx)
    expect(effects).toEqual(['dsh-graphviz: dictionaries', 'dsh-graphviz: styles'])
    expect(document.querySelectorAll('style[data-plugin="@local/dsh-graphviz"]')).toHaveLength(1)
    for (const cleanup of cleanups) cleanup()
    expect(document.querySelectorAll('style[data-plugin="@local/dsh-graphviz"]')).toHaveLength(0)
  })
})
