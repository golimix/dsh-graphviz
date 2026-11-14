/** Localized copy for the Graphviz fence component. */
/** Dictionary keys rendered by the component. */
export type GraphvizKey =
  | 'toolbar.label'
  | 'toolbar.tb'
  | 'toolbar.lr'
  | 'toolbar.graph'
  | 'splitter.label'
  | 'status.rendering'
  | 'status.engine'
  | 'empty'
  | 'error.title'
  | 'error.retry'
  | 'editor.aria'
  | 'editor.loading'
  | 'editor.fallback'
  | 'graph.aria'

/** English dictionary, the fallback for every other locale. */
export const en: Record<GraphvizKey, string> = {
  'toolbar.label': 'DOT',
  'toolbar.tb': 'TB',
  'toolbar.lr': 'LR',
  'toolbar.graph': 'Graph',
  'splitter.label': 'Resize editor and graph',
  'status.rendering': 'Rendering…',
  'status.engine': 'Loading Graphviz engine…',
  empty: 'No diagram',
  'error.title': 'Render failed',
  'error.retry': 'Retry',
  'editor.aria': 'DOT source',
  'editor.loading': 'Loading editor…',
  'editor.fallback': 'Editor unavailable; using plain text.',
  'graph.aria': 'Graphviz diagram',
}

/** Chinese dictionary. */
export const zh: Record<GraphvizKey, string> = {
  'toolbar.label': 'DOT',
  'toolbar.tb': '上图下文',
  'toolbar.lr': '左右分栏',
  'toolbar.graph': '仅图形',
  'splitter.label': '调整源码与图形区域大小',
  'status.rendering': '正在渲染…',
  'status.engine': '正在加载 Graphviz 引擎…',
  empty: '暂无图形',
  'error.title': '渲染失败',
  'error.retry': '重试',
  'editor.aria': 'DOT 源码',
  'editor.loading': '正在加载编辑器…',
  'editor.fallback': '编辑器不可用，已切换为纯文本编辑。',
  'graph.aria': 'Graphviz 图形',
}

/** Dictionaries registered under the `graphviz` namespace. */
export const dictionaries = { en, zh }

/**
 * Resolve a key through the slot-provided translate seat, falling back to the
 * built-in English copy when the seat is absent (tests, early render).
 * @param t - optional slot locale seat.
 * @param key - dictionary key.
 * @param locale - language id used for the built-in fallback.
 * @returns the translated string.
 */
export function translate(
  t: ((key: string) => string) | undefined,
  key: GraphvizKey,
  locale: 'en' | 'zh' = 'en',
): string {
  if (t !== undefined) {
    const value = t(key)
    if (value !== key) return value
  }
  return dictionaries[locale][key]
}
