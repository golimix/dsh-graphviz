/**
 * Minimal typed shapes for the DSH client plugin context this bundle uses.
 * They mirror the public Slot and Locale faces instead of depending on the
 * DSH monorepo's packages, which an out-of-tree bundle cannot resolve.
 */
import type { ComponentType, ReactNode } from 'react'

/** One Markdown fence as the `conversation.chat.markdown.fence` HOC receives it. */
export interface FenceProps {
  /** Fence source. */
  code: string
  /** True while the fence content is still streaming. */
  streaming?: boolean
  /** Fence info string. */
  lang?: string
  /** Inner code-block content shown while streaming. */
  children?: ReactNode
  /** Locale seat injected by the Slot when the registration declares `locale`. */
  t?: (key: string) => string
}

/** Options accepted by `ctx.slots.register`. */
export interface SlotRegistration {
  name: string
  key?: string
  /** Optional registration identity (fence layers use one; document bodies key by id). */
  id?: string
  locale?: string
}

/** The Client Slot registry face. */
export interface SlotsFace {
  /**
   * Wait for a slot to exist, then run the registration callback.
   * @param name - slot name.
   * @param register - callback returning the registration's disposer.
   */
  inject(name: string, register: () => () => void): void
  /**
   * Register one entry into a slot.
   * @param options - slot name, key, id, and optional locale namespace.
   * @param component - the component rendered for the entry.
   * @returns a disposer that removes the entry.
   */
  // Slot entries have per-slot props shapes, so this stays deliberately wide.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register(options: SlotRegistration, component: ComponentType<any>): () => void
}

/** The Client locale service face. */
export interface LocaleFace {
  /**
   * Register a namespace dictionary set. `en` and `zh` are required.
   * @param ns - namespace id.
   * @param dictionaries - language id to dictionary.
   * @returns a disposer that removes the dictionaries.
   */
  register(ns: string, dictionaries: Record<string, Record<string, string>>): () => void
  /**
   * Bind a namespace to the active language.
   * @param ns - namespace id.
   * @returns a translate function.
   */
  bind(ns: string): (key: string) => string
}

/** One text page of an ordinary file, retaining its source line positions. */
export interface DocumentTextPage {
  readonly offset: number
  readonly text: string
  readonly lines: number
}

/** File contents handed to a document renderer. */
export type DocumentContent =
  | { readonly kind: 'text'; readonly text: string; readonly pages: readonly DocumentTextPage[]; readonly eof: boolean }
  | { readonly kind: 'bytes'; readonly data: Uint8Array }
  | {
    readonly kind: 'renderer'
    readonly revision: number
    readonly loaded: (version: string) => void
    readonly failed: () => void
    readonly reload: () => void
  }

/** Props handed to a `sidebar.right.tab.document` body. */
export interface DocumentBodyProps {
  /** Original file address. */
  resourceAddress?: string
  /** Document contents or a renderer-owned loading request. */
  content: DocumentContent
  /** The document toolbar's current wrapping preference. */
  wrap?: boolean
  /** Report an inner scrollport to the owner. */
  scrollportRef?: (element: HTMLElement | null) => void
  /** Observe one file resource for automatic refresh. */
  addResource?: (address: string) => void
  /** Replace this renderer's resources. */
  setResources?: (addresses: readonly string[]) => void
  /** Locale seat injected by the Slot when the registration declares `locale`. */
  t?: (key: string) => string
}

/** One document renderer registration. */
export interface DocumentPreviewRegistration {
  /** Unique implementation id, also the keyed body slot key. */
  id: string
  /** File suffixes without a leading dot. */
  extensions: readonly string[]
  /** Suffixes whose bytes are not readable as text. */
  binaryExtensions?: readonly string[]
  /** External implementations win over product implementations. */
  priority?: 'builtin' | 'extension'
  /** Localized renderer label. */
  title: () => string
  /** Content delivery mode supplied by the document owner. */
  loading: 'text-pages' | 'bytes-complete' | 'renderer'
  /** Whether the renderer consumes the document's wrap preference. */
  wrap?: boolean
  /** Whether the renderer exposes source-line anchors. */
  sourceLines?: boolean
}

/** The document preview registry face. */
export interface DocumentPreviewsFace {
  /**
   * Register one renderer implementation.
   * @param definition - renderer metadata.
   * @returns a disposer that removes the registration.
   */
  register(definition: DocumentPreviewRegistration): () => void
}

/** The subset of the Cordis client context this bundle consumes. */
export interface ClientContext {
  /**
   * Run a side effect owned by the plugin fiber.
   * @param effect - callback returning its cleanup.
   * @param label - diagnostic label.
   */
  effect(effect: () => (() => void) | void, label?: string): void
  slots: SlotsFace
  locale: LocaleFace
  documentPreviews: DocumentPreviewsFace
}
