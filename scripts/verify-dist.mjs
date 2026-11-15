/** Contract checks for the built bundle artifacts. */
import { readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const root = fileURLToPath(new URL('..', import.meta.url))
const dist = join(root, 'dist')

const read = (name) => readFile(join(dist, name), 'utf8')

const host = await read('index.js')
const client = await read('client.js')
const engine = await read('client.engine.js')

const failures = []

/**
 * Assert one condition and remember its failure.
 * @param condition - condition that must hold.
 * @param message - failure description.
 */
function check(condition, message) {
  if (!condition) failures.push(message)
}

check(/export\s*\{[^}]*apply/.test(host) || /export function apply/.test(host), 'dist/index.js must export apply')
check(client.includes('window.__ModuleLoader__.load('), 'dist/client.js must register with the module loader')
check(/id:"@limix\/dsh-graphviz"/.test(client), 'dist/client.js must register the package id')
check(!client.includes('@viz-js/viz'), 'dist/client.js must not inline the Graphviz engine')
check(engine.includes('window.__ModuleLoader__.load('), 'dist/client.engine.js must register with the module loader')
check(/chunk:"client\.engine\.js"/.test(engine), 'dist/client.engine.js must register as a package chunk')
check(engine.includes('renderSvg'), 'dist/client.engine.js must export renderSvg')
check((await stat(join(dist, 'client.engine.js'))).size > 800 * 1024, 'engine chunk should carry the full Graphviz build')

// No vendored engine copy and no CDN engine reference anywhere in the bundle.
let vendored = false
try {
  vendored = (await stat(join(root, 'assets', 'full.render.js'))).isFile()
} catch {
  vendored = false
}
check(!vendored, 'the bundle must not vendor assets/full.render.js')
for (const [name, text] of [['client.js', client], ['client.engine.js', engine]]) {
  check(!text.includes('unpkg.com'), `${name} must not load the engine from a CDN`)
}

// Execute the built engine chunk through the loader registration shape and
// render one real graph, proving the chunk contract rather than just its text.
const nodeRequire = createRequire(import.meta.url)
let registration
const windowDouble = { __ModuleLoader__: { load: (value) => { registration = value } } }
new Function('window', engine)(windowDouble)
if (registration === undefined) {
  failures.push('dist/client.engine.js did not register a factory')
} else if (typeof registration.factory !== 'function') {
  failures.push('dist/client.engine.js registration has no factory')
} else {
  try {
    const exports = registration.factory(nodeRequire)
    const svg = await exports.renderSvg('digraph{a->b}')
    check(typeof svg === 'string' && svg.includes('<svg'), 'built engine chunk must render SVG')
  } catch (error) {
    failures.push(`built engine chunk failed to render: ${String(error)}`)
  }
}

if (failures.length > 0) {
  for (const failure of failures) console.error(`FAIL: ${failure}`)
  process.exit(1)
}
console.log('dist contract verified')
