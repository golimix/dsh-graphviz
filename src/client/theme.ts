/** Host theme detection and change notification. */

/** Color scheme the host currently renders. */
export type ThemeMode = 'light' | 'dark'

/**
 * Read the host's active palette from the document. The Web layout sets
 * `body[data-ds-dark-theme]`; custom themes may instead use `data-theme`,
 * a `dark` class, or the CSS `color-scheme` declaration.
 * @returns `'dark'` when any host signal says dark, otherwise `'light'`.
 */
export function detectTheme(): ThemeMode {
  if (typeof document === 'undefined') return 'light'
  if (document.body?.hasAttribute('data-ds-dark-theme')) return 'dark'
  const bodyTheme = document.body?.getAttribute('data-theme')
  if (bodyTheme === 'dark') return 'dark'
  if (document.documentElement.classList.contains('dark')) return 'dark'
  const scheme = getComputedStyle(document.body).getPropertyValue('color-scheme').trim()
  return scheme === 'dark' ? 'dark' : 'light'
}

/**
 * Observe host theme changes.
 * @param onChange - called with the new mode whenever a theme signal changes.
 * @returns a disposer that stops observing.
 */
export function watchTheme(onChange: (mode: ThemeMode) => void): () => void {
  const observer = new MutationObserver(() => onChange(detectTheme()))
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class', 'data-theme', 'data-ds-dark-theme', 'style'],
  })
  observer.observe(document.body, {
    attributes: true,
    attributeFilter: ['class', 'data-theme', 'data-ds-dark-theme', 'style'],
  })
  return () => observer.disconnect()
}
