# @limix/dsh-graphviz

DSH 的 TypeScript Graphviz 查看器 bundle。它接管 Chat 中的 `dot`、`graphviz`、`gv` 代码围栏，渲染为可缩放、可平移、可折叠、可编辑的 SVG 图形。用户文档见 [docs/DETAIL.md](docs/DETAIL.md)。

## 目录

```
src/
  host/index.ts           # Host 入口（无资源，仅保持行身份）
  client/index.tsx        # 注册 locale、样式与三层 fence
  client/fence/           # GraphvizFence：渲染状态、布局、分隔条
  client/editor/          # Monaco 加载、DOT 语法、编辑器与降级
  client/engine-chunk.ts  # 引擎 chunk 入口（打包 @viz-js/viz）
  client/engine-loader.ts # require.async 懒加载与重试
  client/svg.ts           # SVG 清洗、id 前缀、主题映射
  client/locales.ts       # zh/en 字典
  shared/contract.ts      # host/client/chunk/test 共享常量与类型
  tests/                  # vitest 单元测试
openspec/
  specs/                  # 主规格（OpenSpec）
  changes/archive/        # 归档变更
scripts/build.mjs         # esbuild 构建三个产物
scripts/verify-dist.mjs   # 产物契约检查（含真实渲染）
dist/                     # 构建产物，随仓库提交以便 link 安装直接加载
```

## 开发

```sh
pnpm install
pnpm run typecheck   # tsc --noEmit
pnpm run test        # vitest
pnpm run build       # 产出 dist/index.js、dist/client.js、dist/client.engine.js
pnpm run verify      # typecheck + test + build + 产物契约
```

产物说明：

- `dist/index.js`：ESM Host 入口。
- `dist/client.js`：DSH 客户端模块系统的 lazy-CJS factory，React 从平台模块表解析。
- `dist/client.engine.js`：包内 chunk，登记为 `chunk: "client.engine.js"`，由 `require.async` 按需加载，内含完整 Graphviz WASM 构建。

## 架构要点

- **按需引擎**：主 bundle 不静态导入 `@viz-js/viz`，首次渲染才通过 DSH 模块加载器请求 chunk；失败清空缓存，下一次渲染重试。
- **安全边界**：`sanitizeSvg` 是唯一注入点前的清洗层，元素 allowlist、危险 URL/样式拒绝、实例级 id 前缀都有测试覆盖。
- **主题与文案**：颜色只用 `--dsw-alias-*` token；可见文案经 locale 服务注册，`en`/`zh` 键集合由测试锁定。
- **可降级编辑器**：Monaco 是固定版本的 CDN 资源，加载失败不阻塞编辑和渲染。

## 安装

本地 link 安装：

```sh
dsh plugin --profile <name> add link:/absolute/path/to/dsh-graphviz
```

或在 Plugins 页面选择 **Add plugin** 并指向该目录。该 bundle 是仓库唯一的 Graphviz 围栏渲染插件，同一 profile 中不应再安装其他注册 `dot`/`graphviz`/`gv` 的插件。

## OpenSpec

交付记录与源码同目录：`openspec/specs/` 是主规格，`openspec/changes/archive/` 保留归档变更。在该目录执行 `openspec list`、`openspec validate --strict` 可直接校验；该目录随发布 `files` 清单分发。
