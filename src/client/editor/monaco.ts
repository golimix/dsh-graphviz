/**
 * Monaco loading, DOT language registration, and the minimal API shapes the
 * editor component needs. Monaco stays a pinned CDN resource — the user's
 * chosen trade-off — while types are kept local to avoid pulling the ~80 MB
 * `monaco-editor` package into a small bundle.
 */

/** Monaco's pinned CDN version. */
export const MONACO_VERSION = '0.52.2'

/** Base URL of Monaco's AMD distribution. */
export const MONACO_BASE = `https://cdn.jsdelivr.net/npm/monaco-editor@${MONACO_VERSION}/min/vs`

/** How long the loader waits before falling back to a plain editor. */
export const MONACO_TIMEOUT_MS = 15_000

/** One editor instance created by Monaco. */
export interface MonacoEditorInstance {
  getValue(): string
  setValue(value: string): void
  onDidChangeModelContent(listener: () => void): void
  layout(): void
  focus(): void
  dispose(): void
}

/** Editor creation options used by this bundle. */
export interface MonacoEditorOptions {
  value: string
  language: string
  theme: 'vs' | 'vs-dark'
  fontSize: number
  fontFamily: string
  lineNumbers: 'on'
  minimap: { enabled: boolean }
  scrollBeyondLastLine: boolean
  wordWrap: 'on' | 'off'
  automaticLayout: boolean
  tabSize: number
  smoothScrolling: boolean
  cursorBlinking: 'smooth'
  bracketPairColorization: { enabled: boolean }
  padding: { top: number }
  ariaLabel: string
}

/** Position inside a Monaco model. */
export interface MonacoPosition {
  lineNumber: number
  column: number
}

/** The word until the caret, used to size completion ranges. */
export interface MonacoWord {
  startColumn: number
  endColumn: number
  word: string
}

/** A Monaco text model. */
export interface MonacoModel {
  getWordUntilPosition(position: MonacoPosition): MonacoWord
}

/** A completion suggestion. */
export interface MonacoCompletion {
  label: string
  kind: number
  insertText: string
  insertTextRules?: number
  range: {
    startLineNumber: number
    endLineNumber: number
    startColumn: number
    endColumn: number
  }
  detail?: string
}

/** Monaco's global API subset. */
export interface MonacoGlobal {
  editor: {
    create(container: HTMLElement, options: MonacoEditorOptions): MonacoEditorInstance
    setTheme(theme: 'vs' | 'vs-dark'): void
  }
  languages: {
    register(definition: { id: string }): void
    setMonarchTokensProvider(id: string, provider: unknown): void
    registerCompletionItemProvider(
      id: string,
      provider: {
        triggerCharacters: string[]
        provideCompletionItems(model: MonacoModel, position: MonacoPosition): { suggestions: MonacoCompletion[] }
      },
    ): void
    CompletionItemKind: {
      Keyword: number
      Property: number
      Reference: number
    }
    CompletionItemInsertTextRule: { InsertAsSnippet: number }
  }
}

/** Declared text tokens for the DOT grammar. */
interface MonarchLanguage {
  defaultToken: string
  tokenPostfix: string
  keywords: string[]
  brackets: { open: string; close: string; token: string }[]
  tokenizer: Record<string, unknown>
}

/** AMD loader shape Monaco exposes on `window.require`. */
interface AmdRequire {
  (modules: string[], resolve: () => void, reject: (error: unknown) => void): void
  config(config: { paths: Record<string, string> }): void
}

/** The browser globals this module reads. */
interface MonacoWindow {
  monaco?: MonacoGlobal
  require?: AmdRequire
}

let loading: Promise<MonacoGlobal> | undefined
let dotRegistered = false

/**
 * Check whether the global already carries Monaco (another plugin may have loaded it).
 * @returns the API when present.
 */
function existingMonaco(): MonacoGlobal | undefined {
  const scope = window as unknown as MonacoWindow
  return scope.monaco !== undefined && typeof scope.monaco.editor?.create === 'function'
    ? scope.monaco
    : undefined
}

/**
 * Load Monaco from the pinned CDN, or reuse the global instance.
 * @returns a promise for the Monaco API.
 * @throws when the loader script or editor module fails to load within the timeout.
 */
export function loadMonaco(): Promise<MonacoGlobal> {
  const existing = existingMonaco()
  if (existing !== undefined) {
    registerDotLanguage(existing)
    return Promise.resolve(existing)
  }
  if (loading !== undefined) return loading

  loading = new Promise<MonacoGlobal>((resolve, reject) => {
    const scope = window as unknown as MonacoWindow
    const settle = (error?: Error): void => {
      window.clearTimeout(timer)
      if (error !== undefined) loading = undefined
      if (error === undefined) resolve(scope.monaco as MonacoGlobal)
      else reject(error)
    }
    const start = (): void => {
      const amd = scope.require
      if (amd === undefined) {
        settle(new Error('Monaco AMD loader is unavailable'))
        return
      }
      amd.config({ paths: { vs: MONACO_BASE } })
      amd(
        ['vs/editor/editor.main'],
        () => {
          const monaco = existingMonaco()
          if (monaco === undefined) {
            settle(new Error('Monaco loaded without a global API'))
            return
          }
          registerDotLanguage(monaco)
          settle()
        },
        (error: unknown) => settle(new Error(`Monaco editor failed: ${describe(error)}`)),
      )
    }
    const timer = window.setTimeout(
      () => settle(new Error('Monaco load timed out')),
      MONACO_TIMEOUT_MS,
    )
    if (scope.require !== undefined) {
      start()
      return
    }
    const script = document.createElement('script')
    script.src = `${MONACO_BASE}/loader.js`
    script.async = true
    script.onload = start
    script.onerror = () => settle(new Error('Monaco loader script failed'))
    document.head.appendChild(script)
  })
  return loading
}

/**
 * Describe an arbitrary thrown value for an error message.
 * @param error - the thrown value.
 * @returns a human-readable message.
 */
function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

/**
 * Register the DOT language and completions once per page.
 * @param monaco - the Monaco API.
 * @returns nothing.
 */
function registerDotLanguage(monaco: MonacoGlobal): void {
  if (dotRegistered) return
  dotRegistered = true
  monaco.languages.register({ id: 'dot' })
  monaco.languages.setMonarchTokensProvider('dot', DOT_LANGUAGE)
  monaco.languages.registerCompletionItemProvider('dot', {
    triggerCharacters: [' ', '=', '[', '\n'],
    provideCompletionItems(model, position) {
      const word = model.getWordUntilPosition(position)
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn,
      }
      const snippet = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet
      const kinds = monaco.languages.CompletionItemKind
      const item = (label: string, insertText: string, kind: number, detail?: string): MonacoCompletion => ({
        label,
        kind,
        insertText,
        insertTextRules: snippet,
        range,
        ...(detail === undefined ? {} : { detail }),
      })
      return {
        suggestions: [
          item('digraph', 'digraph {\n  $0\n}', kinds.Keyword, 'Directed graph'),
          item('graph', 'graph {\n  $0\n}', kinds.Keyword, 'Undirected graph'),
          item(
            'subgraph',
            'subgraph cluster_${1:name} {\n  label="${2:title}";\n  $0\n}',
            kinds.Keyword,
            'Subgraph',
          ),
          item('label', 'label="${1:text}"', kinds.Property),
          item(
            'shape',
            'shape=${1|box,ellipse,circle,doublecircle,plaintext,cylinder,note,record|}',
            kinds.Property,
          ),
          item('style', 'style=${1|filled,rounded,dashed,dotted,solid,bold|}', kinds.Property),
          item('color', 'color="${1:#000}"', kinds.Property),
          item('fillcolor', 'fillcolor="${1:#fff}"', kinds.Property),
          item('href', 'href="${1:https://}"', kinds.Property),
          item('target', 'target="${1:_blank}"', kinds.Property),
          item('tooltip', 'tooltip="${1:text}"', kinds.Property),
          item('rankdir', 'rankdir=${1|TB,LR,BT,RL|}', kinds.Property),
          item('fontsize', 'fontsize=${1:12}', kinds.Property),
          item('penwidth', 'penwidth=${1:1}', kinds.Property),
          item('dir', 'dir=${1|forward,back,both,none|}', kinds.Property),
          item('arrowhead', 'arrowhead=${1|normal,dot,vee,none,empty,box|}', kinds.Property),
          ...['box', 'ellipse', 'circle', 'cylinder', 'note', 'doublecircle', 'filled', 'rounded', 'dashed', 'dotted'].map(
            (label) => ({
              label,
              kind: kinds.Reference,
              insertText: label,
              range,
            }),
          ),
        ],
      }
    },
  })
}

/** Monarch grammar for DOT source. */
const DOT_LANGUAGE: MonarchLanguage = {
  defaultToken: '',
  tokenPostfix: '.dot',
  keywords: ['digraph', 'graph', 'subgraph', 'strict', 'node', 'edge'],
  brackets: [
    { open: '{', close: '}', token: 'delimiter.curly' },
    { open: '[', close: ']', token: 'delimiter.square' },
    { open: '(', close: ')', token: 'delimiter.parenthesis' },
  ],
  tokenizer: {
    root: [
      [/\/\/.*$/, 'comment'],
      [/\/\*/, 'comment', '@comment'],
      [/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],
      [/<[^>]*>/, 'tag'],
      [
        /\b(label|shape|color|style|fillcolor|fontcolor|fontsize|fontname|href|target|tooltip|rankdir|rank|dir|arrowhead|arrowtail|arrowsize|penwidth|width|height|fixedsize|margin|bgcolor|border|dashed|dotted|solid|bold|filled|rounded|diagonals|plaintext|compound|constraint|headlabel|taillabel|id|class|peripheries|weight|minlen|image|URL)\b/i,
        'attribute',
      ],
      [/\b(digraph|graph|subgraph|strict|node|edge)\b/i, { cases: { '@keywords': 'keyword' } }],
      [/\d+(?:\.\d+)?/, 'number'],
      [/->|--/, 'operator'],
      [/[=;:]/, 'delimiter'],
      [/[a-zA-Z_]\w*/, 'identifier'],
    ],
    comment: [
      [/[^*/]+/, 'comment'],
      [/\*\//, 'comment', '@pop'],
      [/[*/]/, 'comment'],
    ],
    string: [
      [/[^"\\]+/, 'string'],
      [/\\[\\"]/, 'string'],
      [/"/, { token: 'string.quote', bracket: '@close', next: '@pop' }],
    ],
  },
}
