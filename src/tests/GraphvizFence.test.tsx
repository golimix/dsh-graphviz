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
    expect(screen.getByRole('separator').getAttribute('aria-orientation')).toBe('vertical')

    fireEvent.click(screen.getByText('Graph'))
    expect(root.getAttribute('data-layout')).toBe('graph')
    expect(screen.getByTestId('editor')).toBeTruthy()
    expect((screen.getByTestId('editor').parentElement as HTMLElement).style.display).toBe('none')
    expect(screen.queryByRole('separator')).toBeNull()
  })

  it('resizes with the keyboard', () => {
    render(<GraphvizFence code="digraph{a->b}" />)
    fireEvent.click(screen.getByText('LR'))
    const pane = screen.getByTestId('editor').parentElement as HTMLElement
    expect(pane.style.flexBasis).toBe('45%')
    fireEvent.keyDown(screen.getByRole('separator'), { key: 'ArrowRight' })
    expect(pane.style.flexBasis).toBe('47%')
  })
})
