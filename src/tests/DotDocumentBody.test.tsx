/** Sidebar DOT document body: renders text contents through the shared panel. */
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DotDocumentBody } from '../client/document/DotDocumentBody'

const mocks = vi.hoisted(() => ({ render: vi.fn(), load: vi.fn() }))

vi.mock('../client/engine-loader', () => ({
  loadEngine: () => mocks.load().then(() => ({ renderSvg: mocks.render })),
}))

vi.mock('../client/editor/MonacoEditor', () => ({
  MonacoEditor: () => <div data-testid="editor" />,
}))

const SVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><g><text>x</text></g></svg>'

/** Base props for a completed text document. */
const textProps = {
  content: { kind: 'text' as const, text: 'digraph { a -> b }', pages: [], eof: true },
}

describe('DotDocumentBody', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders nothing for non-text contents', () => {
    const { container } = render(
      <DotDocumentBody content={{ kind: 'bytes', data: new Uint8Array([1]) }} />,
    )
    expect(container.querySelector('[data-dot-document]')).toBeNull()
  })

  it('renders the shared Graphviz panel for DOT text', async () => {
    mocks.load.mockResolvedValue(undefined)
    mocks.render.mockResolvedValue(SVG)
    vi.useFakeTimers()
    try {
      const { container } = render(<DotDocumentBody {...textProps} />)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(250)
      })
      expect(container.querySelector('[data-dot-document]')).toBeTruthy()
      expect(screen.getByTestId('dsh-gv')).toBeTruthy()
      expect(container.querySelector('.dsh-gv-canvas svg')).toBeTruthy()
    } finally {
      vi.useRealTimers()
    }
  })
})
