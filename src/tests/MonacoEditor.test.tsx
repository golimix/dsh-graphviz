/** Monaco editor creation, controlled updates, and the textarea fallback. */
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MonacoEditor } from '../client/editor/MonacoEditor'

const mocks = vi.hoisted(() => ({ loadMonaco: vi.fn() }))

vi.mock('../client/editor/monaco', () => ({
  loadMonaco: mocks.loadMonaco,
  MONACO_VERSION: '0.52.2',
}))

interface FakeEditor {
  getValue: () => string
  setValue: (value: string) => void
  onDidChangeModelContent: (listener: () => void) => void
  layout: () => void
  focus: () => void
  dispose: () => void
}

/**
 * Build a Monaco double and expose its change listener.
 * @param value - initial editor value.
 * @returns the Monaco API and editor.
 */
function monacoDouble(value: string): { monaco: unknown; editor: FakeEditor; fireChange: () => void } {
  let listener: (() => void) | undefined
  let current = value
  const editor: FakeEditor = {
    getValue: () => current,
    setValue: vi.fn((next: string) => {
      current = next
    }),
    onDidChangeModelContent: (next) => {
      listener = next
    },
    layout: vi.fn(),
    focus: vi.fn(),
    dispose: vi.fn(),
  }
  return {
    monaco: {
      editor: { create: vi.fn(() => editor), setTheme: vi.fn() },
      languages: {},
    },
    editor,
    fireChange: () => listener?.(),
  }
}

describe('MonacoEditor', () => {
  afterEach(() => {
    cleanup()
    mocks.loadMonaco.mockReset()
  })

  it('falls back to a textarea when Monaco cannot load', async () => {
    mocks.loadMonaco.mockRejectedValue(new Error('offline'))
    const onChange = vi.fn()
    render(<MonacoEditor value="digraph{}" onChange={onChange} ariaLabel="DOT source" />)
    const textarea = await screen.findByRole('textbox')
    expect(screen.getByRole('status').textContent).toContain('plain text')
    fireEvent.change(textarea, { target: { value: 'graph{}' } })
    expect(onChange).toHaveBeenCalledWith('graph{}')
  })

  it('creates a Monaco editor and reports edits through onChange', async () => {
    const double = monacoDouble('digraph{}')
    mocks.loadMonaco.mockResolvedValue(double.monaco)
    const onChange = vi.fn()
    render(<MonacoEditor value="digraph{}" onChange={onChange} ariaLabel="DOT source" />)
    await waitFor(() => expect((double.monaco as { editor: { create: ReturnType<typeof vi.fn> } }).editor.create).toHaveBeenCalled())
    act(() => double.fireChange())
    expect(onChange).toHaveBeenCalledWith('digraph{}')
  })

  it('pushes external value updates into Monaco', async () => {
    const double = monacoDouble('old')
    mocks.loadMonaco.mockResolvedValue(double.monaco)
    const { rerender } = render(
      <MonacoEditor value="old" onChange={() => undefined} ariaLabel="DOT source" />,
    )
    const api = double.monaco as { editor: { create: ReturnType<typeof vi.fn> } }
    await waitFor(() => expect(api.editor.create).toHaveBeenCalled())
    rerender(<MonacoEditor value="new" onChange={() => undefined} ariaLabel="DOT source" />)
    await waitFor(() => expect(double.editor.setValue).toHaveBeenCalledWith('new'))
  })
})
