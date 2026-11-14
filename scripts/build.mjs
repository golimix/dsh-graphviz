/**
 * Build the three runtime artifacts for the DSH bundle:
 *
 * - `dist/index.js`   — ESM Host entry, bundled for Node.
 * - `dist/client.js`  — lazy-CJS factory registered with the Web module loader.
 * - `dist/client.engine.js` — the same factory shape as a package-local chunk,
 *   carrying the full `@viz-js/viz` Graphviz engine so it loads on demand.
 *
 * The client wrapper matches the format emitted by DSH's `clientBundle` preset:
 * `window.__ModuleLoader__.load({ id, [chunk], factory(require) })`, where the
 * factory receives the module-table `require` and returns CommonJS exports.
 */
import { readFile, rm, mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const root = fileURLToPath(new URL('..', import.meta.url))
const dist = join(root, 'dist')
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))

/**
 * Wrap bundled CommonJS code in the DSH lazy-CJS factory registration.
 * @param code - the CommonJS body produced by esbuild.
 * @param id - the package id that owns the factory.
 * @param chunk - optional package-local chunk file name.
 * @returns the script text the browser module loader expects.
 */
function wrapClient(code, id, chunk) {
  const chunkField = chunk === undefined ? '' : `chunk:${JSON.stringify(chunk)},`
  return `window.__ModuleLoader__.load({id:${JSON.stringify(id)},${chunkField}factory:require=>{var module={exports:{}};var exports=module.exports;\n${code}\nreturn module.exports;}});\n`
}

/** Common esbuild settings for browser code. */
const browser = {
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: ['es2020'],
  jsx: 'automatic',
  logLevel: 'warning',
  write: false,
}

await rm(dist, { recursive: true, force: true })
await mkdir(dist, { recursive: true })

// Host half: plain ESM for the Loader; Node builtins stay external.
const host = await build({
  ...browser,
  format: 'esm',
  platform: 'node',
  target: ['node20'],
  entryPoints: [join(root, 'src/host/index.ts')],
})
await writeFile(join(dist, 'index.js'), host.outputFiles[0].text)

// Client half: small entry registering fence layers, React resolved from the module table.
const client = await build({
  ...browser,
  entryPoints: [join(root, 'src/client/index.tsx')],
  external: ['react', 'react/jsx-runtime'],
  loader: { '.css': 'text' },
})
await writeFile(
  join(dist, 'client.js'),
  wrapClient(client.outputFiles[0].text, pkg.name),
)

// Engine chunk: bundles the full Graphviz build; loaded through `require.async`.
const engine = await build({
  ...browser,
  entryPoints: [join(root, 'src/client/engine-chunk.ts')],
  minify: true,
  legalComments: 'none',
})
await writeFile(
  join(dist, 'client.engine.js'),
  wrapClient(engine.outputFiles[0].text, pkg.name, 'client.engine.js'),
)

const sizes = await Promise.all(
  ['index.js', 'client.js', 'client.engine.js'].map(async (name) => {
    const bytes = (await readFile(join(dist, name))).byteLength
    return `${name}: ${(bytes / 1024).toFixed(1)} KiB`
  }),
)
console.log(`built ${pkg.name}`)
for (const line of sizes) console.log(`  ${line}`)
