/** The Chat fence layer that renders Graphviz diagrams. */
import { useEffect, useMemo, useRef, useState } from 'react'
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

/** Zoom limits and step sizes for the graph viewport. */
const MIN_ZOOM = 0.25
const MAX_ZOOM = 6
const ZOOM_STEP = 1.25
const PAN_STEP = 24
/** Movement in px before a pointer gesture counts as a pan rather than a click. */
const DRAG_THRESHOLD = 4

/** Largest magnification the fitted view applies to a diagram (never blows small ones up). */
const MAX_FIT_SCALE = 2

/**
 * Read the SVG viewBox size so the viewport can fit and centre the diagram.
 * @param svg - sanitized SVG markup.
 * @returns the viewBox size, or null when absent.
 */
function parseViewBox(svg: string): { width: number; height: number } | null {
  const match = /viewBox=(?:"|')\s*[\d.-]+\s+[\d.-]+\s+([\d.]+)\s+([\d.]+)/i.exec(svg)
  if (match === null) return null
  const width = Number.parseFloat(match[1] as string)
  const height = Number.parseFloat(match[2] as string)
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null
  return { width, height }
}

/** Installed layout modes. */
type LayoutMode = 'tb' | 'lr' | 'graph'

/** Render state machine. */
type RenderState =
  | { kind: 'idle' }
  | { kind: 'loading'; engineReady: boolean }
  | { kind: 'ready'; svg: string }
  | { kind: 'error'; message: string }

/** One pan/zoom transform of the graph viewport. */
interface ViewTransform {
  zoom: number
  x: number
  y: number
}

/** The neutral transform: 100%, no pan. */
const NO_TRANSFORM: ViewTransform = { zoom: 1, x: 0, y: 0 }

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
 * Clamp a zoom factor to the supported range.
 * @param zoom - requested zoom.
 * @returns a usable zoom.
 */
function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom))
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
  const [collapsed, setCollapsed] = useState(false)
  const [locked, setLocked] = useState(false)
  const [maximized, setMaximized] = useState(false)
  const [state, setState] = useState<RenderState>(code.trim() === '' ? { kind: 'idle' } : { kind: 'loading', engineReady: false })
  const [retryToken, setRetryToken] = useState(0)
  const [idPrefix] = useState(nextIdPrefix)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLDivElement | null>(null)
  /** Live transform, mirrored into a ref so native listeners never read stale state. */
  const transformRef = useRef<ViewTransform>(NO_TRANSFORM)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  /** Sandboxed canvas size; 0 until a ResizeObserver reports it (or in tests). */
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  /** Pointer gesture in flight on the graph canvas. */
  const gestureRef = useRef<{ pointerId: number; startX: number; startY: number; origin: ViewTransform; moved: boolean } | null>(null)
  /** Set for one click after a drag, so a link under the pointer is not followed. */
  const suppressClickRef = useRef(false)

  const text = (key: GraphvizKey): string => translate(t, key)

  const viewBox = useMemo(
    () => (state.kind === 'ready' ? parseViewBox(state.svg) : null),
    [state],
  )

  const pxMode = viewBox !== null && canvasSize.width > 0 && canvasSize.height > 0

  /**
   * Resolve the rendered box for one zoom/pan pair. The normal view fills the
   * panel width and lets the height follow the diagram (like a web page). The
   * maximized view is bounded: it fits the whole diagram inside the overlay.
   * @param z - zoom relative to the fitted size.
   * @param p - user pan offset.
   * @returns box size, offset and the effective scale.
   */
  const geometry = (z: number, p: { x: number; y: number }): { x: number; y: number; width: number; height: number; scale: number } => {
    if (!pxMode || viewBox === null) return { x: p.x, y: p.y, width: 0, height: 0, scale: z }
    if (maximized) {
      const fit = Math.min(
        MAX_FIT_SCALE,
        canvasSize.width / viewBox.width,
        canvasSize.height / viewBox.height,
      )
      const scale = fit * z
      const width = viewBox.width * scale
      const height = viewBox.height * scale
      return { x: (canvasSize.width - width) / 2 + p.x, y: (canvasSize.height - height) / 2 + p.y, width, height, scale }
    }
    const base = Math.min(MAX_FIT_SCALE, canvasSize.width / viewBox.width)
    const scale = base * z
    const width = viewBox.width * scale
    const height = viewBox.height * scale
    return { x: (canvasSize.width - width) / 2 + p.x, y: 0, width, height, scale }
  }

  const applyTransform = (next: ViewTransform): void => {
    transformRef.current = next
    setZoom(next.zoom)
    setPan({ x: next.x, y: next.y })
  }

  const resetTransform = (): void => {
    applyTransform(NO_TRANSFORM)
  }

  /**
   * Zoom around a point in client coordinates, keeping that point pinned.
   * @param factor - multiplier applied to the current zoom.
   * @param clientX - pointer x; the viewport centre when omitted.
   * @param clientY - pointer y; the viewport centre when omitted.
   */
  const zoomBy = (factor: number, clientX?: number, clientY?: number): void => {
    const current = transformRef.current
    const next = clampZoom(current.zoom * factor)
    if (Math.abs(next - current.zoom) < 1e-4) return
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!pxMode || rect === undefined) {
      applyTransform({ ...current, zoom: next })
      return
    }
    const before = geometry(current.zoom, { x: current.x, y: current.y })
    const after = geometry(next, { x: 0, y: 0 })
    const cx = (clientX ?? rect.left + rect.width / 2) - rect.left
    const cy = (clientY ?? rect.top + rect.height / 2) - rect.top
    const u = (cx - before.x) / before.scale
    if (!maximized) {
      // The page-like view grows downwards, so only the horizontal anchor matters.
      applyTransform({ zoom: next, x: cx - u * after.scale - after.x, y: 0 })
      return
    }
    const v = (cy - before.y) / before.scale
    applyTransform({ zoom: next, x: cx - u * after.scale - after.x, y: cy - v * after.scale - after.y })
  }

  /**
   * Pan the viewport by a fixed step.
   * @param dx - horizontal delta in px.
   * @param dy - vertical delta in px.
   */
  const panBy = (dx: number, dy: number): void => {
    const current = transformRef.current
    applyTransform({ ...current, x: current.x + dx, y: maximized ? current.y + dy : 0 })
  }

  // A finished streaming fence replaces the local draft.
  useEffect(() => {
    setSource(code)
  }, [code])

  // Debounced render; cleanup marks the in-flight attempt as stale. A collapsed
  // panel renders nothing and starts no engine work until it is expanded again.
  useEffect(() => {
    if (collapsed) return
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
          applyTransform(NO_TRANSFORM)
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
  }, [source, retryToken, idPrefix, collapsed])

  // Wheel zoom needs a non-passive listener so the page does not scroll while
  // the pointer is over the graph.
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) return
    const onWheel = (event: WheelEvent): void => {
      if (event.ctrlKey || event.metaKey || event.shiftKey) return
      event.preventDefault()
      zoomBy(Math.exp(-event.deltaY * 0.0015), event.clientX, event.clientY)
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', onWheel)
  }, [state.kind])

  // Track the canvas size so the diagram can be fitted and centred.
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas === null) return
    const measure = (): void => {
      const rect = canvas.getBoundingClientRect()
      setCanvasSize((current) => (
        current.width === Math.round(rect.width) && current.height === Math.round(rect.height)
          ? current
          : { width: Math.round(rect.width), height: Math.round(rect.height) }
      ))
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [state.kind])

  // Escape leaves the maximized view; the diagram keeps its current zoom.
  useEffect(() => {
    if (!maximized) return
    const onKey = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setMaximized(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [maximized])

  const showEditor = layout !== 'graph' && !maximized

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
   * Start a pan gesture on the graph canvas.
   * @param event - pointer down on the canvas.
   */
  const beginPan = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (event.button !== 0) return
    const canvas = event.currentTarget
    gestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      origin: transformRef.current,
      moved: false,
    }
    suppressClickRef.current = false
    try {
      canvas.setPointerCapture(event.pointerId)
    } catch {
      // Synthetic pointers cannot be captured; the listener below still tracks.
    }
  }

  /**
   * Track the in-flight pan gesture.
   * @param event - pointer move on the canvas while a gesture is active.
   */
  const movePan = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const gesture = gestureRef.current
    if (gesture === null || gesture.pointerId !== event.pointerId) return
    const dx = event.clientX - gesture.startX
    const dy = event.clientY - gesture.startY
    if (!gesture.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return
    gesture.moved = true
    suppressClickRef.current = true
    applyTransform({ ...gesture.origin, x: gesture.origin.x + dx, y: maximized ? gesture.origin.y + dy : 0 })
  }

  /**
   * Finish a pan gesture and release pointer capture.
   * @param event - pointer up or cancel on the canvas.
   */
  const endPan = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const gesture = gestureRef.current
    if (gesture === null || gesture.pointerId !== event.pointerId) return
    gestureRef.current = null
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // Nothing to release when the pointer was never captured.
    }
  }

  /**
   * Swallow the click that follows a drag so a link is not followed.
   * @param event - capture-phase click on the canvas.
   */
  const clickCapture = (event: { preventDefault: () => void; stopPropagation: () => void }): void => {
    if (!suppressClickRef.current) return
    suppressClickRef.current = false
    event.preventDefault()
    event.stopPropagation()
  }

  /**
   * Keyboard pan/zoom while the canvas is focused.
   * @param event - key event on the canvas.
   */
  const viewKey = (event: ReactKeyboardEvent<HTMLDivElement>): void => {
    switch (event.key) {
      case '+':
      case '=':
        event.preventDefault()
        zoomBy(ZOOM_STEP)
        return
      case '-':
      case '_':
        event.preventDefault()
        zoomBy(1 / ZOOM_STEP)
        return
      case '0':
      case 'r':
      case 'R':
        event.preventDefault()
        resetTransform()
        return
      case 'ArrowUp':
        event.preventDefault()
        panBy(0, -PAN_STEP)
        return
      case 'ArrowDown':
        event.preventDefault()
        panBy(0, PAN_STEP)
        return
      case 'ArrowLeft':
        event.preventDefault()
        panBy(-PAN_STEP, 0)
        return
      case 'ArrowRight':
        event.preventDefault()
        panBy(PAN_STEP, 0)
        return
      default:
    }
  }

  /**
   * Compute the inline size of the editor pane.
   * @returns CSS properties for the pane.
   */
  const editorStyle = (): CSSProperties => {
    if (layout === 'lr') return { flexBasis: `${split ?? DEFAULT_LR_PERCENT}%` }
    return { height: `${split ?? DEFAULT_TB_HEIGHT}px` }
  }

  const graphBox = geometry(zoom, pan)
  /** Browser-measured views get an explicit height; unit tests keep the CSS default. */
  const autoBodyHeight = pxMode && !maximized
    ? Math.round(graphBox.height + (layout === 'tb' && showEditor ? (split ?? DEFAULT_TB_HEIGHT) + 3 : 0))
    : 0

  /**
   * Enter or leave the maximized view, returning to the fitted 100% view.
   */
  const toggleMaximize = (): void => {
    setMaximized((value) => !value)
    resetTransform()
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
          <div
            ref={canvasRef}
            className="dsh-gv-canvas"
            role="group"
            tabIndex={0}
            aria-label={text('graph.aria')}
            onPointerDown={beginPan}
            onPointerMove={movePan}
            onPointerUp={endPan}
            onPointerCancel={endPan}
            onDoubleClick={resetTransform}
            onClickCapture={clickCapture}
            onKeyDown={viewKey}
          >
            <div
              className="dsh-gv-canvas-inner"
              data-dragging={gestureRef.current?.moved === true}
              style={(() => {
                const box = geometry(zoom, pan)
                if (!pxMode) {
                  return {
                    width: `${zoom * 100}%`,
                    height: `${zoom * 100}%`,
                    transform: `translate(${pan.x}px, ${pan.y}px)`,
                  }
                }
                return {
                  width: `${box.width}px`,
                  height: `${box.height}px`,
                  transform: `translate(${box.x}px, ${box.y}px)`,
                }
              })()}
              dangerouslySetInnerHTML={{ __html: state.svg }}
            />
          </div>
        )
      case 'idle':
        return <div className="dsh-gv-empty">{text('empty')}</div>
    }
  })()

  return (
    <>
      {maximized ? (
        <div
          className="dsh-gv-backdrop"
          aria-hidden="true"
          onClick={toggleMaximize}
        />
      ) : null}
      <div
        ref={containerRef}
        className="dsh-gv"
        data-layout={layout}
        data-collapsed={collapsed}
        data-locked={locked}
        data-maximized={maximized}
        role={maximized ? 'dialog' : undefined}
        aria-modal={maximized ? true : undefined}
        aria-label={maximized ? text('graph.aria') : undefined}
        data-testid="dsh-gv"
      >
      <div className="dsh-gv-toolbar">
        <span className="dsh-gv-brand">{text('toolbar.label')}</span>
        {collapsed ? <span className="dsh-gv-collapsed-note">{text('collapsed.note')}</span> : null}
        <span className="dsh-gv-spacer" />
        {collapsed ? null : (
          <>
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
            <div className="dsh-gv-zoomctl" role="group" aria-label={text('zoom.aria')}>
              <button
                type="button"
                className="dsh-gv-button dsh-gv-zoom-button"
                aria-label={text('zoom.out')}
                title={text('zoom.out')}
                onClick={() => zoomBy(1 / ZOOM_STEP)}
              >
                −
              </button>
              <button
                type="button"
                className="dsh-gv-button dsh-gv-zoom-value"
                aria-label={text('zoom.reset')}
                title={text('zoom.reset')}
                onClick={resetTransform}
              >
                {`${Math.round(zoom * 100)}%`}
              </button>
              <button
                type="button"
                className="dsh-gv-button dsh-gv-zoom-button"
                aria-label={text('zoom.in')}
                title={text('zoom.in')}
                onClick={() => zoomBy(ZOOM_STEP)}
              >
                +
              </button>
              <button
                type="button"
                className="dsh-gv-button"
                aria-label={text('zoom.reset')}
                title={text('zoom.reset')}
                onClick={resetTransform}
              >
                ↺
              </button>
            </div>
            <button
              type="button"
              className="dsh-gv-button"
              data-active={locked}
              aria-pressed={locked}
              aria-label={text(locked ? 'toolbar.unlock' : 'toolbar.lock')}
              title={text(locked ? 'toolbar.unlock' : 'toolbar.lock')}
              onClick={() => setLocked((value) => !value)}
            >
              {locked ? '🔒' : '🔓'}
            </button>
            <button
              type="button"
              className="dsh-gv-button"
              aria-pressed={maximized}
              aria-label={text(maximized ? 'toolbar.restore' : 'toolbar.maximize')}
              title={text(maximized ? 'toolbar.restore' : 'toolbar.maximize')}
              onClick={toggleMaximize}
            >
              {text(maximized ? 'toolbar.restore' : 'toolbar.maximize')}
            </button>
          </>
        )}
        <button
          type="button"
          className="dsh-gv-button"
          aria-expanded={!collapsed}
          onClick={() => setCollapsed((value) => !value)}
        >
          {text(collapsed ? 'toolbar.expand' : 'toolbar.collapse')}
        </button>
      </div>
      <div
        className="dsh-gv-body"
        style={
          collapsed
            ? { display: 'none' }
            : maximized
              ? { flex: '1 1 auto', height: 'auto', minHeight: 0 }
              : autoBodyHeight > 0
                ? { height: `${autoBodyHeight}px` }
                : undefined
        }
      >
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
          locked ? (
            <div className="dsh-gv-splitter" aria-hidden="true" />
          ) : (
            <div
              className="dsh-gv-splitter"
              role="separator"
              tabIndex={0}
              aria-orientation={layout === 'lr' ? 'vertical' : 'horizontal'}
              aria-label={text('splitter.label')}
              onPointerDown={beginResize}
              onKeyDown={resizeKey}
            />
          )
        ) : null}
        <div className="dsh-gv-graph">{pane}</div>
      </div>
      </div>
    </>
  )
}
