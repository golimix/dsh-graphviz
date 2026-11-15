# Proposal

## Why

DSH Chat 需要把 `dot`、`graphviz`、`gv` 三种代码围栏稳定地渲染为可交互的 SVG 图形，并且这部分能力要能长期维护。此前仓库中的围栏渲染缺少类型检查、可重复构建与自动化测试，引擎来源与文档也容易与实现脱节。本变更新建一个自洽的 TypeScript bundle，把源码、构建脚本、测试、locale、文档与 OpenSpec 交付记录都收进同一仓库，作为仓库唯一的 Graphviz 围栏渲染实现。

## What Changes

- 新增 bundle（仓库根目录，包名 `@limix/dsh-graphviz`，行 id `dsh-graphviz`），作为仓库唯一的 Graphviz 围栏渲染实现。
- 源码全部使用 TypeScript（`strict`），拆分为宿主入口、客户端入口、Graphviz 引擎懒加载 chunk、SVG 处理、主题、locale 与 Monaco 编辑器等模块。
- 引擎改为直接依赖 npm 包 `@viz-js/viz`（Graphviz 16.1.0 的完整版 WASM 构建，约 1.1 MB），通过客户端模块系统的 `require.async('./client.engine.js')` 按需加载，不再在仓库内复制 `full.render.js`，也不再从 CDN 拉取引擎。
- 宿主侧不提供引擎静态路由：宿主入口只保留空 `apply`，图形渲染完全由客户端 chunk 完成。
- 保留 Monaco 编辑器（用户明确选择继续使用 CDN），固定版本并增加加载失败时的 textarea 降级；DOT 语言高亮与补全注册逻辑迁入带类型的模块。
- bundle 提供完整的插件元数据：中英文 locale、图标、详情文档（`meta.detail`）、`files`/`exports`/`dsh` 清单。
- 建立质量门禁：`typecheck`、`vitest` 单元测试、`build`，并提交可被本地 link 安装直接加载的 `dist` 产物。
- 删除此前的手写围栏渲染实现及其 profile 依赖，仓库与 profile 中只保留这一个注册 `dot`/`graphviz`/`gv` fence 的插件。
- 把 OpenSpec 交付记录迁入仓库根目录，主 specs 与归档变更随 bundle 一起维护，并纳入发布 `files` 清单。

## Capabilities

### New Capabilities

- `graphviz-fence-rendering`: 在 Chat 中将 `dot`、`graphviz`、`gv` 代码围栏渲染为可交互 SVG，包含流式状态、布局切换、源码编辑、错误呈现与 SVG 安全处理。
- `graphviz-bundle-packaging`: TypeScript bundle 的构建、依赖、懒加载引擎、插件元数据、单一渲染器契约与 OpenSpec 交付记录。

### Modified Capabilities

_无。主 specs 由本变更首次建立。_

## Impact

- 新增：仓库根目录下的源码、构建脚本、测试、`dist`、locale、docs、icon、`cordis.patch.yml` 与 `openspec/`。
- 删除：此前手写围栏渲染实现所在的目录，以及 profile 中对应的依赖、lockfile 记录与插件行。
- 新增依赖：运行时 `@viz-js/viz`；开发期 `typescript`、`esbuild`、`vitest`、`happy-dom`、`@types/react`。
- 运行时：bundle 依赖 DSH Client 模块系统的 chunk 加载能力（`require.async`）与 `conversation.chat.markdown.fence` 插槽。
- 分布：OpenSpec 目录随 `files` 发布，安装者可在 bundle 内查看 SDD 交付记录。
