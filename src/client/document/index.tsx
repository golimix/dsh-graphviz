/** Registers the DOT document renderer for the right Sidebar. */
import type { ClientContext } from '../dsh'
import { DotDocumentBody } from './DotDocumentBody'
import { DOC_NAMESPACE, dictionaries } from './locales'

/** Implementation id, shared by the registry entry and the keyed body slot. */
export const DOT_DOCUMENT_ID = '@limix/dsh-graphviz/document/dot'

/** Document slot that owns file-preview bodies. */
export const DOCUMENT_SLOT = 'sidebar.right.tab.document'

/**
 * Register the `.dot` renderer: metadata in the document preview registry and
 * its body in the keyed document slot. An extension-band registration outranks
 * the builtin text renderer while keeping it selectable in the dropdown.
 * @param ctx - the client root context.
 */
export function registerDotDocument(ctx: ClientContext): void {
  const t = ctx.locale.bind(DOC_NAMESPACE)
  ctx.effect(() => ctx.locale.register(DOC_NAMESPACE, dictionaries), 'dsh-graphviz: document dictionaries')
  ctx.effect(
    () => ctx.documentPreviews.register({
      id: DOT_DOCUMENT_ID,
      extensions: ['dot'],
      priority: 'extension',
      title: () => t('title'),
      loading: 'text-pages',
      wrap: true,
    }),
    'dsh-graphviz: document preview',
  )
  ctx.slots.inject(DOCUMENT_SLOT, () => ctx.slots.register(
    { name: DOCUMENT_SLOT, key: DOT_DOCUMENT_ID, locale: DOC_NAMESPACE },
    DotDocumentBody,
  ))
}
