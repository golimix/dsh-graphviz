# Tasks

## 1. 注册与正文

- [x] 1.1 `src/client/dsh.ts` 补 `DocumentPreviewsFace`、`DocumentBodyProps` 与可注入的 slot 注册类型
- [x] 1.2 新增 `src/client/document/index.tsx`：以 `extensions: ['dot']`、`priority: 'extension'`、`loading: 'text-pages'` 注册元数据，并在 `sidebar.right.tab.document` 注册正文
- [x] 1.3 新增 `src/client/document/DotDocumentBody.tsx`，复用 `GraphvizPanel`（编辑、渲染、布局、缩放、锁定、放大查看、折叠）
- [x] 1.4 `src/client/index.tsx` 调用注册模块，`inject` 增加 `documentPreviews`；`package.json` 的 `dsh.client.inject` 增加 `@deepseek-ai/dsh-client-ui-sidebar-documentpreview`

## 2. 文案与文档

- [x] 2.1 文档命名空间 `documentDot`（zh/en 字典复用围栏键集合 + `title`），`locale/*.json` 描述提到侧边栏 `.dot`
- [x] 2.2 中英 README 与 DETAIL 增加侧边栏预览说明，明确「草稿编辑、无保存按钮、文件 API 只读」

## 3. 验证与发布

- [x] 3.1 测试：注册元数据与 body 槽断言、`DotDocumentBody` 文本内容渲染、非文本内容不渲染；更新既有 inject/effect 期望
- [x] 3.2 `pnpm run verify`（typecheck + 44 个测试 + 构建 + dist 契约）通过
- [x] 3.3 归档本变更并补充发布说明
