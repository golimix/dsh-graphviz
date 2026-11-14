/** Client entry: register locale dictionaries, styles, and the three fence layers. */
import styles from './styles.css'
import { PACKAGE_ID, FENCE_KEYS, FENCE_SLOT, LOCALE_NS } from '../shared/contract'
import type { ClientContext } from './dsh'
import { GraphvizFence } from './fence/GraphvizFence'
import { dictionaries } from './locales'

/** Services required before the plugin can register anything. */
export const inject = ['slots', 'locale']

/**
 * Install the plugin-owned stylesheet and return its removal.
 * @param css - stylesheet text bundled from `styles.css`.
 * @returns a disposer that removes the style element.
 */
function installStyles(css: string): () => void {
  const style = document.createElement('style')
  style.dataset.plugin = PACKAGE_ID
  style.textContent = css
  document.head.appendChild(style)
  return () => style.remove()
}

/**
 * Client plugin body. Every registration rides the plugin fiber so disabling
 * the bundle removes dictionaries, styles, and all three fence layers.
 * @param ctx - the client root context.
 * @returns nothing.
 */
export function apply(ctx: ClientContext): void {
  ctx.effect(() => ctx.locale.register(LOCALE_NS, dictionaries), 'dsh-graphviz: dictionaries')
  ctx.effect(() => installStyles(styles), 'dsh-graphviz: styles')
  for (const key of FENCE_KEYS) {
    ctx.slots.inject(FENCE_SLOT, () =>
      ctx.slots.register(
        { name: FENCE_SLOT, key, id: `${PACKAGE_ID}/fence/${key}`, locale: LOCALE_NS },
        GraphvizFence,
      ),
    )
  }
}
