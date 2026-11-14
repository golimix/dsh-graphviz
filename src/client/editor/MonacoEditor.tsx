/** Monaco-backed DOT source editor with a plain-text fallback. */
import { useEffect, useRef, useState } from 'react'
import type { KeyboardEvent as ReactKeyboardEvent } from 'react'
import { detectTheme, watchTheme } from '../theme'
import { translate } from '../locales'
import { loadMonaco, type MonacoEditorInstance } from './monaco'

/** Props of the source editor. */
export interface MonacoEditorProps {
  /** Controlled DOT source. */
  value: string
  /** Called on every edit with the editor's current value. */
  onChange: (value: string) => void
  /** Accessible label for the editing surface. */
  ariaLabel: string
  /** Slot-provided translate seat. */
  t?: (key: string) => string
}

/**
 * Render the source editor. Monaco loads lazily from the pinned CDN; while it
 * loads the area shows a short notice, and when it fails a textarea takes over
 * so editing and rendering keep working offline.
 * @param props - controlled value and change handler.
 * @returns the editor pane.
 */
export function MonacoEditor({ value, onChange, ariaLabel, t }: MonacoEditorProps) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const editorRef = useRef<MonacoEditorInstance | null>(null)
  const applyingRef = useRef(false)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const [ready, setReady] = useState(false)
  const [fallback, setFallback] = useState(false)

  // Create the Monaco editor once; failure switches to the textarea.
  useEffect(() => {
    let disposed = false
    let stopTheme: (() => void) | undefined

    loadMonaco()
      .then((monaco) => {
        if (disposed) return
        const host = hostRef.current
        if (host === null) return
        const editor = monaco.editor.create(host, {
          value,
          language: 'dot',
          theme: detectTheme() === 'dark' ? 'vs-dark' : 'vs',
          fontSize: 13,
          fontFamily: "'Fira Code','Cascadia Code','SF Mono',monospace",
          lineNumbers: 'on',
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: 'on',
          automaticLayout: true,
          tabSize: 2,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          bracketPairColorization: { enabled: true },
          padding: { top: 10 },
          ariaLabel,
        })
        editorRef.current = editor
        editor.onDidChangeModelContent(() => {
          if (!applyingRef.current) onChangeRef.current(editor.getValue())
        })
        stopTheme = watchTheme((mode) => monaco.editor.setTheme(mode === 'dark' ? 'vs-dark' : 'vs'))
        setReady(true)
      })
      .catch(() => {
        if (!disposed) setFallback(true)
      })

    return () => {
      disposed = true
      stopTheme?.()
      editorRef.current?.dispose()
      editorRef.current = null
    }
    // Creation is intentionally mount-only; controlled updates flow through the value effect.
  }, [])

  // Push external updates (for example a finished streaming fence) into Monaco.
  useEffect(() => {
    const editor = editorRef.current
    if (editor === null || editor.getValue() === value) return
    applyingRef.current = true
    editor.setValue(value)
    applyingRef.current = false
  }, [value])

  if (fallback) {
    return (
      <div className="dsh-gv-editor dsh-gv-editor-fallback">
        <div className="dsh-gv-editor-notice" role="status">
          {translate(t, 'editor.fallback')}
        </div>
        <textarea
          className="dsh-gv-textarea"
          aria-label={ariaLabel}
          spellCheck={false}
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          onKeyDown={insertSpaces}
        />
      </div>
    )
  }

  return (
    <div className="dsh-gv-editor">
      <div ref={hostRef} className="dsh-gv-monaco" aria-label={ariaLabel} />
      {ready ? null : <div className="dsh-gv-editor-notice">{translate(t, 'editor.loading')}</div>}
    </div>
  )
}

/**
 * Insert two spaces instead of moving focus when Tab is pressed in the fallback.
 * @param event - the textarea key event.
 */
function insertSpaces(event: ReactKeyboardEvent<HTMLTextAreaElement>): void {
  if (event.key !== 'Tab') return
  event.preventDefault()
  const target = event.currentTarget
  const start = target.selectionStart
  const end = target.selectionEnd
  const text = `${target.value.slice(0, start)}  ${target.value.slice(end)}`
  target.value = text
  target.selectionStart = start + 2
  target.selectionEnd = start + 2
  target.dispatchEvent(new Event('input', { bubbles: true }))
}
