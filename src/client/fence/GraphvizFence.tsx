/** The Chat fence layer that renders Graphviz diagrams. */
import { useEffect, useRef, useState } from 'react'
import type {
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from 'react'
import type { FenceProps } from '../dsh'
import { loadEngine } from '../engine-loader'
import { translate, type GraphvizKey } from '../locales'
import { sanitizeSvg } from '../svg'
import { MonacoEditor } from '../editor/MonacoEditor'

/** Delay between the last edit and a render attempt. */
export const RENDER_DEBOUNCE_MS = 250

/** Editor pane sizes at which the splitter starts. */
const DEFAULT_TB_HEIGHT = 250
const DEFAULT_LR_PERCENT = 45
const MIN_PANE_PX = 80
const MIN_LR_PERCENT = 20
const MAX_LR_PERCENT = 70

/** Installed layout modes. */
type LayoutMode = 'tb' | 'lr' | 'graph'

/** Render state machine. */
type RenderState =
  | { kind: 'idle' }
  | { kind: 'loading'; engineReady: boolean }
  | { kind: 'ready'; svg: string }
  | { kind: 'error'; message: string }

let instanceSeq = 0

/**
 * Generate a unique, XML-id-safe prefix for one diagram instance.
 * @returns a prefix such as `gv3-`.
 */
function nextIdPrefix(): string {
  instanceSeq += 1
  return `gv${instanceSeq}-`
}

/**
 * Fence entry: stream the raw code block until the fence settles, then mount
 * the interactive panel.
 * @param props - fence props from the Chat slot.
 * @returns the raw children while streaming, otherwise the Graphviz panel.
 */
export function GraphvizFence(props: FenceProps) {
  return props.streaming === true ? <>{props.children}</> : <GraphvizPanel props={props} />
}

/**
 * Interactive source/graph panel.
 * @param root0 - fence props.
 * @returns the panel.
 */
export function GraphvizPanel({ props }: { props: FenceProps }) {
  const { code, t } = props
  const [source, setSource] = useState(code)
  const [layout, setLayout] = useState<LayoutMode>('tb')
  const [split, setSplit] = useState<number | null>(null)
  const [state, setState] = useState<RenderState>(code.trim() === '' ? { kind: 'idle' } : { kind: 'loading', engineReady: false })
  const [retryToken, setRetryToken] = useState(0)
  const [idPrefix] = useState(nextIdPrefix)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const text = (key: GraphvizKey): string => translate(t, key)

  // A finished streaming fence replaces the local draft.
  useEffect(() => {
    setSource(code)
  }, [code])

  // Debounced render; cleanup marks the in-flight attempt as stale.
  useEffect(() => {
    const input = source
    if (input.trim() === '') {
      setState({ kind: 'idle' })
      return
    }
    let cancelled = false
    setState({ kind: 'loading', engineReady: false })
    const timer = window.setTimeout(() => {
      loadEngine()
        .then((chunk) => {
          if (cancelled) return undefined
          setState({ kind: 'loading', engineReady: true })
          return chunk.renderSvg(input)
        })
        .then((raw) => {
          if (cancelled || raw === undefined) return
          setState({ kind: 'ready', svg: sanitizeSvg(raw, { idPrefix }) })
        })
        .catch((error: unknown) => {
          if (cancelled) return
          setState({ kind: 'error', message: error instanceof Error ? error.message : String(error) })
        })
    }, RENDER_DEBOUNCE_MS)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [source, retryToken, idPrefix])

  const showEditor = layout !== 'graph'

  /**
   * Clamp a proposed split to the current pane bounds.
   * @param value - proposed size in px (tb) or percent (lr).
   * @returns a usable size.
   */
  const clamp = (value: number): number => {
    if (layout === 'lr') return Math.min(MAX_LR_PERCENT, Math.max(MIN_LR_PERCENT, value))
    const height = containerRef.current?.getBoundingClientRect().height ?? 500
    return Math.min(height - MIN_PANE_PX, Math.max(MIN_PANE_PX, value))
  }

  /**
   * Track a pointer drag on the separator until release.
   * @param event - pointer down on the separator.
   */
  const beginResize = (event: ReactPointerEvent<HTMLDivElement>): void => {
    event.preventDefault()
    const handle = event.currentTarget
    const container = containerRef.current
    if (container === null) return
    try {
      handle.setPointerCapture(event.pointerId)
    } catch {
      // Synthetic or already-released pointers cannot be captured; dragging still tracks via the handle listeners.
    }
    const move = (moveEvent: PointerEvent): void => {
      const rect = container.getBoundingClientRect()
      if (layout === 'lr') {
        setSplit(Math.round(((moveEvent.clientX - rect.left) / rect.width) * 100))
      } else {
        setSplit(clamp(moveEvent.clientY - rect.top))
      }
    }
    const stop = (): void => {
      handle.removeEventListener('pointermove', move)
      handle.removeEventListener('pointerup', stop)
      handle.removeEventListener('pointercancel', stop)
    }
    handle.addEventListener('pointermove', move)
    handle.addEventListener('pointerup', stop)
    handle.addEventListener('pointercancel', stop)
  }

  /**
   * Move the splitter from the keyboard.
   * @param event - key event on the separator.
   */
  const resizeKey = (event: ReactKeyboardEvent<HTMLDivElement>): void => {
    const horizontal = layout === 'lr'
    const current = split ?? (horizontal ? DEFAULT_LR_PERCENT : DEFAULT_TB_HEIGHT)
    const step = event.shiftKey ? 10 : 2
    let next: number | undefined
    if (horizontal && event.key === 'ArrowLeft') next = current - step
    else if (horizontal && event.key === 'ArrowRight') next = current + step
    else if (!horizontal && event.key === 'ArrowUp') next = current - step * 5
    else if (!horizontal && event.key === 'ArrowDown') next = current + step * 5
    else if (event.key === 'Home') next = horizontal ? MIN_LR_PERCENT : MIN_PANE_PX
    else if (event.key === 'End') next = horizontal ? MAX_LR_PERCENT : 1000
    if (next === undefined) return
    event.preventDefault()
    setSplit(clamp(next))
  }

  /**
   * Compute the inline size of the editor pane.
   * @returns CSS properties for the pane.
   */
  const editorStyle = (): CSSProperties => {
    if (layout === 'lr') return { flexBasis: `${split ?? DEFAULT_LR_PERCENT}%` }
    return { height: `${split ?? DEFAULT_TB_HEIGHT}px` }
  }

  const pane = (() => {
    switch (state.kind) {
      case 'loading':
        return (
          <div className="dsh-gv-status" aria-live="polite">
            <span className="dsh-gv-spinner" aria-hidden="true" />
            {text(state.engineReady ? 'status.rendering' : 'status.engine')}
          </div>
        )
      case 'error':
        return (
          <div className="dsh-gv-error" role="alert">
            <div className="dsh-gv-error-title">{text('error.title')}</div>
            <div className="dsh-gv-error-body">{state.message}</div>
            <button
              type="button"
              className="dsh-gv-button"
              onClick={() => setRetryToken((value) => value + 1)}
            >
              {text('error.retry')}
            </button>
          </div>
        )
      case 'ready':
        return (
          <div className="dsh-gv-canvas" aria-label={text('graph.aria')} dangerouslySetInnerHTML={{ __html: state.svg }} />
        )
      case 'idle':
        return <div className="dsh-gv-empty">{text('empty')}</div>
    }
  })()

  return (
    <div
      ref={containerRef}
      className="dsh-gv"
      data-layout={layout}
      data-testid="dsh-gv"
    >
      <div className="dsh-gv-toolbar">
        <span className="dsh-gv-brand">{text('toolbar.label')}</span>
        <span className="dsh-gv-spacer" />
        {(['tb', 'lr', 'graph'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            className="dsh-gv-button"
            data-active={layout === mode}
            aria-pressed={layout === mode}
            onClick={() => {
              setLayout(mode)
              setSplit(null)
            }}
          >
            {text(`toolbar.${mode}` as GraphvizKey)}
          </button>
        ))}
      </div>
      <div className="dsh-gv-body">
        <div
          className="dsh-gv-editor-pane"
          style={showEditor ? editorStyle() : { display: 'none' }}
        >
          <MonacoEditor
            value={source}
            onChange={setSource}
            ariaLabel={text('editor.aria')}
            t={t}
          />
        </div>
        {showEditor ? (
          <div
            className="dsh-gv-splitter"
            role="separator"
            tabIndex={0}
            aria-orientation={layout === 'lr' ? 'vertical' : 'horizontal'}
            aria-label={text('splitter.label')}
            onPointerDown={beginResize}
            onKeyDown={resizeKey}
          />
        ) : null}
        <div className="dsh-gv-graph">{pane}</div>
      </div>
    </div>
  )
}
