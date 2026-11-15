# Tasks

## 1. Bundle 脚手架与工具链

- [x] 1.1 创建仓库根目录的 `package.json`、统一覆盖 host/client/tests 的 `tsconfig.json`、`.gitignore`，确认包名 `@limix/dsh-graphviz`、`exports`/`files`/`dsh` 清单字段齐全；用 `pnpm install` 后 `node -e` 读取 manifest 验证关键字段
- [x] 1.2 安装并锁定依赖：运行时 `@viz-js/viz@3.31.0`；开发期 `typescript`、`esbuild`、`vitest`、`happy-dom`、`@types/react`、`@types/node`；验证 `pnpm ls` 中版本与 lockfile 一致
- [x] 1.3 编写 `scripts/build.mjs`：用 esbuild 产出 `dist/index.js`（ESM host）、`dist/client.js` 与 `dist/client.engine.js`（lazy-CJS factory + `chunk` 登记），验证脚本从空 `dist` 重建三个文件且产物包含 `window.__ModuleLoader__.load`
- [x] 1.4 编写 `vitest.config.ts` 与测试脚本入口，验证 `pnpm test` 能运行全部测试并输出通过结果

## 2. 共享契约与宿主入口

- [x] 2.1 实现 `src/shared/*`：插件 id、fence key 列表、引擎 chunk 路径与渲染选项类型；验证各模块可被 host/client/测试同时导入且无 DOM 依赖
- [x] 2.2 实现 `src/host/index.ts`（空 `apply`，不注册引擎路由）与 `cordis.patch.yml`（行 id `dsh-graphviz`）；验证构建后的 `dist/index.js` 导出 `apply` 函数
- [x] 2.3 编写 `locale/en.json`、`locale/zh.json`（标题、描述、`meta.detail`）与 `icon.svg`；验证中英文键一致、SVG 可解析且尺寸在限制内
- [x] 2.4 编写 `docs/DETAIL.md` 与 `README.md`，覆盖功能、用法、引擎来源、Monaco CDN 限制与单一渲染器约定；验证文档链接的文件真实存在

## 3. Graphviz 引擎 chunk

- [x] 3.1 实现 `src/client/engine-chunk.ts`：导入 `@viz-js/viz`，单例 `instance()`，导出 `renderSvg(source, options)` 并在错误时抛出带 Graphviz 诊断的 Error；验证引擎 chunk 契约测试能渲染 `digraph{a->b}` 并返回 `<svg`
- [x] 3.2 实现 `src/client/engine-loader.ts`：通过 `require.async('./client.engine.js')` 懒加载、memoize、失败后清空缓存并允许重试；验证 loader 单测覆盖成功、失败、重试三种路径
- [x] 3.3 在 built-artifact 集成测试与真实浏览器中验证：无围栏时不请求 `client.engine.js`，首个围栏出现后才加载，后续围栏复用同一实例

## 4. Client fence 渲染与交互

- [x] 4.1 实现 `src/client/index.tsx`：注册 `dot`/`graphviz`/`gv` 三层，`inject: ['slots', 'locale']`、注册 `locale` 命名空间；验证应用启动后三层 key 已注册且非目标语言不接管
- [x] 4.2 实现 `src/client/fence/GraphvizFence.tsx`：流式直通、去抖渲染、过期结果丢弃、加载/错误/空状态、主题 token 样式；验证组件测试覆盖流式、错误恢复与慢渲染竞态
- [x] 4.3 实现 TB/LR/Graph 布局与可拖动、可键盘操作的分隔条；验证组件测试覆盖模式切换、拖动边界与键盘步进
- [x] 4.4 实现 `src/client/editor/MonacoEditor.tsx` 与 DOT 语法/补全模块，固定 Monaco 0.52.2；验证加载成功时使用 Monaco、加载失败/超时后降级为 textarea 且编辑可触发渲染
- [x] 4.5 实现 `src/client/svg.ts` 安全清洗与 id 前缀、尺寸自适应；验证单测覆盖合法 SVG 保留、脚本/事件/`javascript:` 移除、多实例 id 隔离
- [x] 4.6 实现 locale 字典 `src/client/locales.ts` 并在组件中使用 `t`；验证测试断言 zh/en 键集合一致

## 5. 质量门禁与安装切换

- [x] 5.1 增加 `verify` 脚本串联 `typecheck`、`test`、`build`；验证 `pnpm run verify` 全部通过且 `git status` 仅显示预期产物
- [x] 5.2 通过 `plugin_manager` 安装 `@limix/dsh-graphviz`，并在同一操作中移除此前手写实现的依赖与插件行；验证安装结果 `application` 为 applied，profile 中只有本包注册 `dot`/`graphviz`/`gv`
- [x] 5.3 在新会话的 Web GUI 中端到端验证三种围栏、流式、编辑、布局、错误、深浅色、中英文；验证每张图只渲染一次且控制台无错误
- [x] 5.4 检查插件列表元数据、图标与详情页；验证中英文标题/描述、图标渲染、`docs/DETAIL.md` 可打开

## 6. OpenSpec 交付记录

- [x] 6.1 把 `openspec/` 从 `bundles/openspec` 迁入仓库根目录；验证在 bundle 目录内执行 `openspec list --specs` 能列出主 specs 与归档变更
- [x] 6.2 从主 specs、归档 `proposal.md`/`design.md`/`tasks.md` 与 `README.md`/`docs/DETAIL.md` 中剔除关于手写实现的内容，统一为单一渲染器叙事；验证 `openspec validate --strict` 通过
- [x] 6.3 在 `package.json` 的 `files` 清单中加入 `openspec`；验证 `npm pack --dry-run` 列出该目录

## Workflow follow-up

- 满足评审要求后归档本变更：`openspec archive add-dsh-graphviz-ts-bundle`，并确认主 specs 已更新。
- 将 feature 分支按 Conventional Commits 合并回 `master`。
