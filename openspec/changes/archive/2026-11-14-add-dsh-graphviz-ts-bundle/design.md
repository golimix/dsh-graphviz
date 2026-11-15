# Design

## Context

仓库需要从零建立一个可维护的 Graphviz 围栏渲染 bundle。此前的手写实现以单个 ES module 交付：宿主侧从静态资源读取约 2 MB 的 Viz.js 2.1.2（Graphviz 2.40.1）并通过专用 HTTP 路由提供，客户端把引擎加载、Monaco 加载、DOT 语法定义、主题、布局、SVG 注入与槽注册全部挤在一个文件里，没有构建、测试与类型检查，文档也长期与实现不符。这些差异只作为设计约束输入，不在本变更中保留或迁移。

目标宿主为声明 `platform: web` 的 DSH Web GUI；插槽为 `conversation.chat.markdown.fence`。运行环境是浏览器 + DSH Client 模块系统（lazy-CJS factory + 平台模块表）。详见 `proposal.md` 与 `specs/`。

## Goals / Non-Goals

**Goals:**
- TypeScript 源码，严格类型检查，模块边界清晰，可单测。
- 引擎直接复用官方 `@viz-js/viz` 完整版，按需加载，仓库不再自带引擎拷贝。
- 保持用户可见能力：三种 fence、TB/LR/Graph 布局、可拖动分隔条、源码编辑、Monaco 高亮与补全、SVG 链接。
- 在 Monaco 不可用时仍可编辑与渲染。
- 产出可直接被本地 link 安装加载的 `dist`。
- 作为仓库唯一的 Graphviz 围栏渲染实现，交付记录（OpenSpec）与源码同目录维护。

**Non-Goals:**
- 不引入 Graphviz 以外的布局引擎选择器，不改变“仅 SVG、仅 dot 引擎”的输出约定。
- 不实现服务端渲染、图形导出（PNG/PDF）或离线 Monaco 打包。
- 不重做 DSH 的 slot/theme/locale 基础设施。
- 不为其他围栏语言或第二套 Graphviz 实现保留注册路径。

## Decisions

### 1. TypeScript + esbuild，自写构建脚本
仓库外插件无法使用 DSH monorepo 的 `clientBundle` tsdown 预设。选择 `tsc` 负责类型检查、`esbuild` 负责转译与打包：
- `src/host/index.ts` → `dist/index.js`（ESM，host 入口）。
- `src/client/index.tsx` → `dist/client.js`（lazy-CJS factory 包装，外部化 `react`/`react/jsx-runtime`）。
- `src/client/engine-chunk.ts` → `dist/client.engine.js`（同样的 factory 包装，`chunk` 字段登记，内含 `@viz-js/viz`）。
- 构建脚本统一注入 `window.__ModuleLoader__.load({ id, factory })` 包装，避免手写样板。
备选：tsdown（依赖 DSH 内部预设，外部仓库不适用）、纯 `tsc`（无法产出浏览器 factory 包装与单文件 chunk）。

### 2. 引擎通过 client chunk 懒加载
`@viz-js/viz@3.31.0` 的 `dist/viz.js` 约 1.1 MB，WASM 内联、无需额外请求，Node 下实测可渲染 Graphviz 16.1.0。客户端主 bundle 不静态导入引擎；首次渲染时调用模块加载器注入的 `require.async('./client.engine.js')`，由 DSH 按 revision 提供的 chunk 路由加载并缓存。
- 为什么不用宿主路由：少一个 HTTP 面、少一个生命周期资源，且引擎版本由 `package.json` 锁定，不再复制文件。
- 为什么不用静态 import：避免约 1.1 MB 在插件激活时进入启动路径。
- 为什么不用 CDN：供应链、离线与隐私风险；用户明确要求“直接引用完全版引擎”。
备选：宿主路由提供 `viz-global.js`（需要额外静态资源路径）、`import()` 裸 URL（依赖页面 CSP 与 classic script 的 URL 解析，不如 `require.async` 契约稳定）。

### 3. SVG 安全处理 + id 隔离
Graphviz 输出经 `DOMParser` 解析后用 allowlist 清洗：移除 `script`、`foreignObject`、`iframe`、`object`、`embed` 等元素，移除 `on*` 事件属性与 `javascript:`/`data:` 链接，只保留 Graphviz 需要的 SVG 元素与表现属性。每个实例给内部 id 加前缀并重写 `url(#id)`、`href="#id"` 引用，避免同一对话内多图 id 冲突。
备选：直接 `dangerouslySetInnerHTML`（XSS 面）、`<img src="data:image/svg+xml">`（安全但丢失链接与文本选择）。

### 4. Monaco 保留但可降级
按用户选择继续使用 Monaco 0.52.2（jsdelivr，固定版本）。`MonacoEditor` 组件负责：加载 loader、注册 DOT Monarch 语法与补全、主题跟随、销毁与布局；加载失败或超时后渲染 `textarea` 降级编辑器。DOT 语法定义与补全数据放在类型化模块中，使用最小本地接口描述 Monaco API，避免引入约 80 MB 的 `monaco-editor` 开发依赖。
风险与缓解见下一节。

### 5. 主题与文案走宿主能力
样式使用宿主 `--dsw-alias-*` token（如 `--dsw-alias-bg-layer-1`、`--dsw-alias-border-l2`、`--dsw-alias-label-secondary`），不维护第二套调色板；深色/浅色由 token 自动切换，Monaco 主题仅需读取 `data-ds-dark-theme`/`color-scheme`。可见文案进入 `ctx.locale.register('graphviz', { zh, en })`，组件通过注册选项的 `locale` 得到 `t` 座位，缺省时回退到内置字典。

### 6. 唯一渲染器与交付
`dist/*.js` 作为可加载产物提交到仓库（本地 link 安装不会运行构建脚本），源码仍是唯一事实来源；`pnpm run verify` 重建并跑测试。包名 `@limix/dsh-graphviz`、行 id `dsh-graphviz` 是仓库与 profile 中唯一声明 `dot`/`graphviz`/`gv` fence 的插件；此前的手写实现与 profile 依赖随本变更移除，不做并存或切换。回滚方式为移除本 bundle 并回退到上一个提交，而不是保留第二套渲染器。

### 7. OpenSpec 与 bundle 同目录
交付记录迁入仓库根目录：`specs/` 是主规格，`changes/archive/` 保留本变更的归档。OpenSpec CLI 在该目录下解析 root，`files` 清单包含 `openspec`，使 bundle 自身携带 SDD 证据；发布时不需要额外文档站。

## Risks / Trade-offs

- [Monaco CDN 不可用或版本被下架] → 固定版本 + 加载超时 + textarea 降级；详情文档如实说明“高亮需要联网”。
- [引擎 chunk 依赖 `require.async` 契约] → 构建产物使用 DSH 的 `chunk` 登记格式；用真实浏览器渲染验证；chunk 加载失败显示错误并可重试。
- [1.1 MB WASM chunk 首次加载慢] → 只在首次渲染加载并缓存实例；加载期间显示“加载引擎”状态；不阻塞页面启动。
- [提交 `dist` 可能与源码漂移] → `verify` 总是重建；评审时比较 `git diff`；`dist` 只由构建脚本生成。
- [allowlist 过严会破坏合法 SVG（渐变、链接、图像）] → 覆盖 Graphviz 常用元素与属性，单测覆盖合法/恶意两类样本。
- [OpenSpec 目录随包发布增加体积] → 目录仅含 Markdown 与 YAML，体积可忽略；换来安装即可审阅交付记录。
- [大图阻塞主线程] → 保留去抖与过期结果丢弃；在文档中说明超大图可能卡顿。

## Migration Plan

1. 在 feature 分支完成源码、构建、测试与文档。
2. 把 OpenSpec 交付记录迁入仓库根目录，同步主 specs 与本归档。
3. 本地安装 `@limix/dsh-graphviz` 到 Web profile，并在同一操作中移除此前手写实现的依赖与插件行。
4. 新会话中验证三种围栏、流式、编辑、布局、错误与主题；确认插件列表元数据与图标，且每个围栏只渲染一次。
5. 回滚：移除本 bundle 依赖并回退到上一个提交；不恢复第二套渲染器。

## Open Questions

_无。编辑器方案、单一渲染器与 OpenSpec 随 bundle 分发的方式已由用户确认；引擎版本按 `@viz-js/viz` 最新稳定版锁定，后续升级作为独立变更。_
