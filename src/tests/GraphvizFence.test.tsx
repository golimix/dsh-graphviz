/** Fence behavior: streaming, debounce, errors, retry, stale results, layout. */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GraphvizFence, RENDER_DEBOUNCE_MS } from '../client/fence/GraphvizFence'

const mocks = vi.hoisted(() => ({ render: vi.fn(), load: vi.fn() }))

vi.mock('../client/engine-loader', () => ({
  loadEngine: () => mocks.load().then(() => ({ renderSvg: mocks.render })),
}))

vi.mock('../client/editor/MonacoEditor', () => ({
  MonacoEditor: () => <div data-testid="editor" />,
}))

const SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><g><text>x</text></g></svg>'

/**
 * Advance the debounce timer and flush the engine promise.
 * @returns a promise that settles after React processed the result.
 */
async function flushRender(): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(RENDER_DEBOUNCE_MS)
  })
}

describe('GraphvizFence', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mocks.render.mockReset()
    mocks.load.mockReset()
    mocks.load.mockResolvedValue(undefined)
    mocks.render.mockResolvedValue(SVG)
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('shows the inner code block while streaming', () => {
    render(
      <GraphvizFence code="digraph{a->b}" streaming children={<span>raw source</span>} />,
    )
    expect(screen.getByText('raw source')).toBeTruthy()
    expect(screen.queryByTestId('dsh-gv')).toBeNull()
  })

  it('renders after the debounce and sanitizes the SVG', async () => {
    const { container } = render(<GraphvizFence code="digraph{a->b}" />)
    await flushRender()
    expect(mocks.render).toHaveBeenCalledWith('digraph{a->b}')
    expect(screen.getByTestId('dsh-gv')).toBeTruthy()
    expect(container.querySelector('.dsh-gv-canvas svg')).toBeTruthy()
  })

  it('shows an error and retries without losing the panel', async () => {
    mocks.render.mockRejectedValueOnce(new Error('syntax error in line 1')).mockResolvedValueOnce(SVG)
    render(<GraphvizFence code="digraph{a->}" />)
    await flushRender()
    expect(screen.getByRole('alert').textContent).toContain('syntax error')
    fireEvent.click(screen.getByText('Retry'))
    await flushRender()
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByTestId('dsh-gv')).toBeTruthy()
  })

  it('discards a stale render when the source changes', async () => {
    let resolveOld: ((svg: string) => void) | undefined
    const old = new Promise<string>((resolve) => {
      resolveOld = resolve
    })
    const next = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><g><text>new</text></g></svg>'
    mocks.render.mockReturnValueOnce(old).mockResolvedValueOnce(next)

    const { rerender, container } = render(<GraphvizFence code="digraph{old}" />)
    await flushRender()
    rerender(<GraphvizFence code="digraph{new}" />)
    await flushRender()
    resolveOld?.(SVG)
    await act(async () => {
      await Promise.resolve()
    })
    expect(container.querySelector('.dsh-gv-canvas')?.textContent).toContain('new')
  })

  it('switches layouts and hides the editor in graph mode', () => {
    render(<GraphvizFence code="digraph{a->b}" />)
    const root = screen.getByTestId('dsh-gv')
    expect(root.getAttribute('data-layout')).toBe('tb')

    fireEvent.click(screen.getByText('LR'))
    expect(root.getAttribute('data-layout')).toBe('lr')
    expect(screen.getByLabelText('Resize editor and graph').getAttribute('aria-orientation')).toBe('vertical')

    fireEvent.click(screen.getByText('Graph'))
    expect(root.getAttribute('data-layout')).toBe('graph')
    expect(screen.getByTestId('editor')).toBeTruthy()
    expect((screen.getByTestId('editor').parentElement as HTMLElement).style.display).toBe('none')
    expect(screen.queryByLabelText('Resize editor and graph')).toBeNull()
  })

  it('zooms with the toolbar controls and resets to 100%', async () => {
    const { container } = render(<GraphvizFence code="digraph{a->b}" />)
    await flushRender()
    expect(screen.getByText('100%')).toBeTruthy()
    fireEvent.click(screen.getByLabelText('Zoom in'))
    expect(screen.getByText('125%')).toBeTruthy()
    fireEvent.click(screen.getByLabelText('Zoom out'))
    fireEvent.click(screen.getByLabelText('Zoom out'))
    expect(screen.getByText('80%')).toBeTruthy()
    const inner = container.querySelector('.dsh-gv-canvas-inner') as HTMLElement
    expect(inner.style.width).toBe('80%')
    expect(inner.style.height).toBe('80%')
    fireEvent.click(screen.getAllByLabelText('Reset zoom')[0] as HTMLElement)
    expect(screen.getByText('100%')).toBeTruthy()
    expect((container.querySelector('.dsh-gv-canvas-inner') as HTMLElement).style.width).toBe('100%')
  })

  it('zooms and resets from the keyboard', async () => {
    const { container } = render(<GraphvizFence code="digraph{a->b}" />)
    await flushRender()
    const canvas = container.querySelector('.dsh-gv-canvas') as HTMLElement
    fireEvent.keyDown(canvas, { key: '+' })
    expect(screen.getByText('125%')).toBeTruthy()
    fireEvent.keyDown(canvas, { key: '0' })
    expect(screen.getByText('100%')).toBeTruthy()
  })

  it('zooms with the wheel without scrolling the page', async () => {
    const { container } = render(<GraphvizFence code="digraph{a->b}" />)
    await flushRender()
    const canvas = container.querySelector('.dsh-gv-canvas') as HTMLElement
    const event = new Event('wheel', { bubbles: true, cancelable: true })
    Object.defineProperty(event, 'deltaY', { value: -120 })
    act(() => {
      canvas.dispatchEvent(event)
    })
    expect(event.defaultPrevented).toBe(true)
    expect(screen.getByText('120%')).toBeTruthy()
  })

  it('collapses the body and skips rendering while hidden', async () => {
    const { container, rerender } = render(<GraphvizFence code="digraph{a->b}" />)
    await flushRender()
    expect(mocks.render).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByText('Collapse'))
    const body = container.querySelector('.dsh-gv-body') as HTMLElement
    expect(body.style.display).toBe('none')
    expect(screen.getByText('Expand')).toBeTruthy()
    rerender(<GraphvizFence code="digraph{a->c}" />)
    await flushRender()
    expect(mocks.render).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByText('Expand'))
    await flushRender()
    expect(mocks.render).toHaveBeenCalledTimes(2)
    expect(body.style.display).toBe('')
  })

  it('resizes the panel height from the handle and resets to auto', async () => {
    const { container } = render(<GraphvizFence code="digraph{a->b}" />)
    await flushRender()
    const body = container.querySelector('.dsh-gv-body') as HTMLElement
    const handle = screen.getByLabelText('Resize panel height')
    fireEvent.keyDown(handle, { key: 'ArrowDown' })
    expect(body.style.height).toBe('440px')
    fireEvent.keyDown(handle, { key: 'Enter' })
    expect(body.style.height).toBe('')
  })

  it('resizes with the keyboard', () => {
    render(<GraphvizFence code="digraph{a->b}" />)
    fireEvent.click(screen.getByText('LR'))
    const pane = screen.getByTestId('editor').parentElement as HTMLElement
    expect(pane.style.flexBasis).toBe('45%')
    fireEvent.keyDown(screen.getByLabelText('Resize editor and graph'), { key: 'ArrowRight' })
    expect(pane.style.flexBasis).toBe('47%')
  })
})
