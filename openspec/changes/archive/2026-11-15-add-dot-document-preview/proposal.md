# Proposal

## Why

DSH 里很多场景直接产出 `.dot` 文件；右侧 Sidebar 的文件导航能打开它们，但目前只能落到纯文本/代码预览，看不到图形。围栏里已有的编辑 + 渲染 + 缩放能力应该复用给这些文件，让“打开一个 .dot”和“打开一张图”是同一件事。

## What Changes

- 通过公开扩展点注册 `.dot` 文档渲染器：`ctx.documentPreviews.register({ extensions: ['dot'], priority: 'extension', loading: 'text-pages' })`，并在 `sidebar.right.tab.document` 槽按同一 id 注册正文。
- 正文复用围栏面板（`GraphvizPanel`）：源码编辑、实时重渲染、TB/LR/仅图形布局、缩放、锁定、放大查看、折叠全部一致。
- 渲染器注册在 `extension` 通道，优先级高于内建的纯文本/代码实现，同时渲染器下拉仍保留纯文本选项，用户可随时切回。
- 编辑是本地草稿：Sidebar 的文件 API（`remote.workspaceFiles`）只有 `read/stat/readBytes/list/search/changes`，没有写接口，因此面板不提供保存按钮；保存经 Agent 的 fs 工具或外部编辑器完成。
- 客户端 manifest 的 `inject` 增加 `@deepseek-ai/dsh-client-ui-sidebar-documentpreview`，`inject` 服务列表增加 `documentPreviews`。
- 文档（README 与 DETAIL，中英各一份）说明侧边栏预览与“草稿编辑、无保存按钮”的边界。

## Capabilities

### New Capabilities

- `dot-document-preview`: `.dot` 文件在右侧 Sidebar 中的渲染、编辑、渲染器选择与只读边界。

### Modified Capabilities

_无。`graphviz-fence-rendering` 与 `graphviz-bundle-packaging` 的既有约定不变，仅新增注入依赖与文档说明。_

## Impact

- 改动：`src/client/index.tsx`、`src/client/dsh.ts`、`src/client/styles.css`、`package.json`（`dsh.client.inject`）、`README*.md`、`docs/DETAIL*.md`、`locale/*.json`（描述）、`dist/*`。
- 新增：`src/client/document/**`、`src/tests/DotDocumentBody.test.tsx`、`openspec/changes/add-dot-document-preview/**`。
- 不变：围栏渲染行为、引擎加载、SVG 清洗、`files` 清单。
