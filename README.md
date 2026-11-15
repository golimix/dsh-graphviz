# @limix/dsh-graphviz

English | [中文](README.zh.md)

A TypeScript Graphviz viewer bundle for DSH. It takes over `dot`, `graphviz`, and `gv` code fences in Chat and renders them as zoomable, pannable, collapsible, editable SVG diagrams. User documentation: [docs/DETAIL.md](docs/DETAIL.md).

## Layout

```
src/
  host/index.ts           # Host entry (no resources, keeps the Loader row identity)
  client/index.tsx        # registers locale, styles, and the three fence layers
  client/fence/           # GraphvizFence: render state, layout, splitter
  client/editor/          # Monaco loading, DOT grammar, editor and fallback
  client/engine-chunk.ts  # engine chunk entry (bundles @viz-js/viz)
  client/engine-loader.ts # require.async lazy loading and retry
  client/svg.ts           # SVG sanitizing, id prefixing, theme mapping
  client/locales.ts       # zh/en dictionaries
  shared/contract.ts      # constants and types shared by host/client/chunk/tests
  tests/                  # vitest unit tests
openspec/
  specs/                  # main specs (OpenSpec)
  changes/archive/        # archived changes
scripts/build.mjs         # esbuild build for the three artifacts
scripts/verify-dist.mjs   # artifact contract check (includes a real render)
dist/                     # built artifacts, committed so link installs load directly
```

## Development

```sh
pnpm install
pnpm run typecheck   # tsc --noEmit
pnpm run test        # vitest
pnpm run build       # writes dist/index.js, dist/client.js, dist/client.engine.js
pnpm run verify      # typecheck + test + build + artifact contract
```

Artifacts:

- `dist/index.js`: ESM Host entry.
- `dist/client.js`: lazy-CJS factory for the DSH client module system; React resolves through the platform module table.
- `dist/client.engine.js`: package-local chunk registered as `chunk: "client.engine.js"`, loaded on demand through `require.async`, carrying the full Graphviz WASM build.

## Architecture

- **On-demand engine**: the main bundle never statically imports `@viz-js/viz`; the first render asks the DSH module loader for the chunk, a failure clears the cache, and the next render retries.
- **Safety boundary**: `sanitizeSvg` is the only cleaning layer before injection; element allowlists, unsafe URL/style rejection, and per-instance id prefixes all have test coverage.
- **Theme and copy**: colors only use `--dsw-alias-*` tokens; visible copy is registered through the locale service, and tests lock the `en`/`zh` key sets.
- **Editor with fallback**: Monaco is a CDN resource at a pinned version; a load failure never blocks editing or rendering.

## Sidebar preview

Opening a `.dot` file from the right Sidebar's file navigator uses the same panel as a Chat fence: source editing, live re-render, layouts, zoom, lock, maximize, and collapse. The renderer registers at the `extension` band, so the builtin plain-text/code viewer stays selectable in the renderer dropdown. Editing is a local draft: the Sidebar file API is read-only, so saving goes through the agent or an external editor rather than a save button.

## Install

Local link install:

```sh
dsh plugin --profile <name> add link:/absolute/path/to/dsh-graphviz
```

Or pick **Add plugin** in the Plugins page and point it at this directory. This bundle is the repository's only Graphviz fence renderer; do not install another plugin that registers `dot`/`graphviz`/`gv` in the same profile.

## OpenSpec

The delivery record lives beside the source: `openspec/specs/` holds the main specs and `openspec/changes/archive/` keeps archived changes. Run `openspec list` or `openspec validate --strict` there to review and validate; the directory ships inside the published `files` list.
