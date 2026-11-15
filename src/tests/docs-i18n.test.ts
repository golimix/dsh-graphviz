/** Bilingual documentation and locale metadata pairing tests. */
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { en, zh } from '../client/locales'

/** Repo root, resolved from this test file. */
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..')

/**
 * Read a repository file as text.
 * @param path - repository-relative path.
 * @returns the file text.
 */
function read(path: string): string {
  return readFileSync(join(root, path), 'utf8')
}

/**
 * Assert that a Markdown pair carries the language switcher immediately after its H1.
 * @param english - English document path.
 * @param chinese - Chinese document path.
 */
function expectSwitchers(english: string, chinese: string): void {
  const enDoc = read(english)
  const zhDoc = read(chinese)
  const enHead = enDoc.split('\n').slice(0, 6).join('\n')
  const zhHead = zhDoc.split('\n').slice(0, 6).join('\n')
  expect(enHead).toContain('English | [中文](')
  expect(zhHead).toContain('[English](')
}

describe('bilingual documentation', () => {
  it('ships an English and a Chinese README with switchers', () => {
    expectSwitchers('README.md', 'README.zh.md')
  })

  it('ships an English and a Chinese detail document', () => {
    expect(existsSync(join(root, 'docs/DETAIL.md'))).toBe(true)
    expect(existsSync(join(root, 'docs/DETAIL.zh.md'))).toBe(true)
    // Detail documents are shown per active UI language and carry no switcher.
    expect(read('docs/DETAIL.md')).not.toContain('English | [中文]')
    expect(read('docs/DETAIL.zh.md')).not.toContain('[English](')
  })

  it('points each locale metadata at its own detail document', () => {
    const readLocale = (language: string): { meta: { detail: string } } =>
      JSON.parse(read(`locale/${language}.json`)) as { meta: { detail: string } }
    const detailEn = readLocale('en').meta.detail
    const detailZh = readLocale('zh').meta.detail
    expect(existsSync(join(root, detailEn))).toBe(true)
    expect(existsSync(join(root, detailZh))).toBe(true)
    expect(detailZh.endsWith('.zh.md')).toBe(true)
    expect(detailEn.endsWith('.zh.md')).toBe(false)
  })

  it('keeps the Chinese README linked from the English counterpart and back', () => {
    expect(read('README.md')).toContain('[中文](README.zh.md)')
    expect(read('README.zh.md')).toContain('[English](README.md)')
  })

  it('keeps locale metadata titles and descriptions distinct per language', () => {
    const meta = (language: string): { title: string; description: string } => {
      const parsed = JSON.parse(read(`locale/${language}.json`)) as { meta: { title: string; description: string } }
      return parsed.meta
    }
    expect(meta('en').title).not.toBe(meta('zh').title)
    expect(meta('en').description).not.toBe(meta('zh').description)
    expect(en['zoom.in']).not.toBe(zh['zoom.in'])
  })
})
