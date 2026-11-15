# Proposal

## Why

现在围栏里的图形只能「按容器宽度铺满」查看：没有放大、缩小与重置，小字标签和密集连线看不清；面板始终占据 420px 以上的高度，一段对话里连着几张图时非常占空间。用户在自己生成 HTML 时体验更好——可缩放、可拖动、可收起。需要把这种人机交互补进围栏面板，并保持与折叠态、流式状态、错误态一致。

## What Changes

- 图形视口新增缩放控制：工具栏上的 `−`、百分比（点击即重置）、`+`、`↺` 四个按钮；滚轮缩放（阻止页面滚动）、双击重置、聚焦后 `+`/`−`/`0`/方向键操作。
- 缩放范围 25%–600%，缩放围绕指针位置进行；每次渲染出新图形后自动回到 100%。
- 图形视口支持指针拖动平移；拖动超过阈值后吞掉随后的 click，避免误触图形里的链接。
- 面板新增折叠：工具栏「折叠/展开」按钮，折叠后只留工具栏，图形区不渲染也不加载引擎；展开后恢复。
- 新增 i18n 键（缩放与折叠）、样式（`dsh-gv-zoomctl`、可拖动光标），并补充组件测试。

## Capabilities

### New Capabilities

_无。_

### Modified Capabilities

- `graphviz-fence-rendering`: 新增「图形缩放、平移与重置」与「面板折叠」两项 Requirement，覆盖三种围栏、布局模式与流式/错误态下的既有行为。

## Impact

- 改动：`src/client/fence/GraphvizFence.tsx`、`src/client/styles.css`、`src/client/locales.ts`、`locale/zh.json`、`locale/en.json`、`src/tests/GraphvizFence.test.tsx`、`README.md`、`docs/DETAIL.md`、`dist/*`、`package.json`（版本 `0.2.0`）。
- 新增：`openspec/changes/add-graphviz-zoom-and-collapse/**`。
- 不变：fence 语言集合、引擎来源与 SVG 安全清洗、Monaco 编辑器与布局切换行为。
