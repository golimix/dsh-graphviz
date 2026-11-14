/**
 * Host half of the dsh-graphviz bundle.
 *
 * Rendering needs no Host service: the browser loads the Graphviz engine chunk
 * on its own. The row stays mounted so the bundle keeps its identity, config
 * surface, and client half in the plugin inventory.
 */

/**
 * Activate the Host row. The bundle owns no Host resources, so activation is
 * intentionally a no-op and releases nothing.
 * @returns nothing.
 */
export function apply(): void {}
