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
  id: string
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
  register(options: SlotRegistration, component: ComponentType<FenceProps>): () => void
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
}
