/** Dictionary parity and translation fallback tests. */
import { describe, expect, it } from 'vitest'
import { dictionaries, en, translate, zh } from '../client/locales'

describe('locales', () => {
  it('keeps English and Chinese dictionaries on the same keys', () => {
    expect(Object.keys(zh).sort()).toEqual(Object.keys(en).sort())
  })

  it('registers the dictionaries under the graphviz namespace', () => {
    expect(dictionaries.en).toBe(en)
    expect(dictionaries.zh).toBe(zh)
  })

  it('uses the slot translate seat when it has the key', () => {
    expect(translate((key) => (key === 'empty' ? '空' : key), 'empty')).toBe('空')
  })

  it('falls back to the built-in copy when the seat is missing or misses', () => {
    expect(translate(undefined, 'empty', 'zh')).toBe('暂无图形')
    expect(translate((key) => key, 'empty')).toBe('No diagram')
  })

  it('has non-empty copy for every key', () => {
    for (const value of Object.values(en)) expect(value.trim()).not.toBe('')
    for (const value of Object.values(zh)) expect(value.trim()).not.toBe('')
  })
})
