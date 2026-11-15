/** Document-preview dictionaries: fence copy plus the renderer label. */
import { en as fenceEn, zh as fenceZh } from '../locales'

/** Locale namespace owned by the DOT document preview. */
export const DOC_NAMESPACE = 'documentDot'

/** Document-preview dictionary keys. */
export type DocumentKey = 'title'

/** English document-preview dictionary. */
export const en: Record<string, string> = { ...fenceEn, title: 'Graphviz render' }

/** Chinese document-preview dictionary. */
export const zh: Record<string, string> = { ...fenceZh, title: 'Graphviz 渲染' }

/** Dictionaries registered under the document namespace. */
export const dictionaries = { en, zh }
