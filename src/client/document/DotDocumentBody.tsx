/** Sidebar document body that renders a `.dot` file with its source editor. */
import type { ReactNode } from 'react'
import type { DocumentBodyProps } from '../dsh'
import { GraphvizPanel } from '../fence/GraphvizFence'

/**
 * Document tab body for DOT files: reuse the fence panel so editing, layouts,
 * zoom, lock, maximize, and collapse behave exactly as in Chat.
 * @param props - document contents and the document locale seat.
 * @returns the panel, or nothing for non-text contents.
 */
export function DotDocumentBody({ content, t }: DocumentBodyProps): ReactNode {
  if (content.kind !== 'text') return null
  return (
    <div className="dsh-gv-document" data-dot-document>
      <GraphvizPanel props={{ code: content.text, t }} />
    </div>
  )
}
