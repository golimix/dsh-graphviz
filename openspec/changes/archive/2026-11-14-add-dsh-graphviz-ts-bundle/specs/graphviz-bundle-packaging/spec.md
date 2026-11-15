# Spec Delta

## Purpose

以 TypeScript 源码、可重复构建和按需加载的官方完整版 Graphviz 引擎交付 DSH 唯一的 Graphviz 围栏渲染 bundle，并把 OpenSpec 交付记录与源码同目录维护。

## ADDED Requirements

### Requirement: 源码使用 TypeScript 且构建可重复

bundle 的运行时代码 SHALL 全部来自 TypeScript/TSX 源码，并通过仓库内的构建脚本产出：ESM 宿主入口、lazy-CJS 客户端入口、按需加载的引擎 chunk。运行 `build` MUST 无需网络即可基于已安装依赖重建这些产物，且产物 MUST 能被本地 link 安装直接加载。

#### Scenario: 从源码重建
- **WHEN** 在仓库根目录执行安装依赖后的 `pnpm run build`
- **THEN** `dist/index.js`、`dist/client.js`、`dist/client.engine.js` 全部重新生成

#### Scenario: 本地 link 安装可加载
- **WHEN** DSH 以本地目录方式安装该 bundle 并启动客户端
- **THEN** 客户端能注册 fence 层，无需在安装目录内再次构建

#### Scenario: 类型检查失败即阻断
- **WHEN** 源码存在 TypeScript 类型错误
- **THEN** `pnpm run typecheck` 失败，构建验证流程不通过

### Requirement: Graphviz 引擎按需引用官方完整版

bundle SHALL 直接依赖 npm 包 `@viz-js/viz` 提供的完整版引擎，MUST NOT 在仓库内复制 `full.render.js`，MUST NOT 通过 CDN 加载引擎，MUST NOT 在宿主侧提供引擎静态路由。引擎 MUST 只在首次需要渲染时加载，加载后 MUST 复用同一实例，加载失败 MUST 显示错误并允许后续重试。

#### Scenario: 首次渲染才加载引擎
- **WHEN** 页面启动但对话中没有任何 Graphviz 围栏
- **THEN** 不请求 `client.engine.js` chunk，也不初始化 WASM 引擎

#### Scenario: 引擎只加载一次
- **WHEN** 同一页面渲染多个 Graphviz 围栏
- **THEN** 引擎 chunk 与 WASM 实例各只初始化一次

#### Scenario: 引擎加载失败可重试
- **WHEN** 引擎 chunk 请求失败
- **THEN** 面板显示错误信息；下一次源码变化会重新尝试加载并恢复渲染

#### Scenario: 仓库不含引擎副本
- **WHEN** 检查仓库内的源码与资源目录
- **THEN** 不存在仓库内自带的 `full.render.js` 或等价引擎拷贝

### Requirement: 插件元数据与清单完整

bundle SHALL 声明唯一的包名与 Loader 行 id，并提供中英文 `meta.title`、`meta.description`、`meta.detail`、有效图标、`exports` 与 `files`。客户端清单 MUST 声明 `platform: web`、`immediately` 与 fence 插槽所属包的 inject 依赖。

#### Scenario: 插件列表显示本地化元数据
- **WHEN** 在 Plugins 页面查看该 bundle
- **THEN** 中文与英文界面分别显示对应标题和描述，详情页可打开 `docs/DETAIL.md`

#### Scenario: 图标有效
- **WHEN** 插件行渲染图标
- **THEN** 显示 bundle 自带的 SVG 图标，而不是默认占位图

#### Scenario: 客户端清单驱动加载
- **WHEN** 客户端模块系统组合启用行
- **THEN** 该包以 `web` 客户端身份加载 `./client` 入口，并在 Chat fence 插槽就绪后注册三层 key

### Requirement: 单一 Graphviz 渲染器

仓库与 profile SHALL 只保留一个接管 `dot`、`graphviz`、`gv` 围栏的插件；同一 fence key MUST NOT 被两个插件同时注册，仓库 MUST NOT 携带第二份 Graphviz 围栏渲染实现。OpenSpec 交付记录 SHALL 位于仓库根目录，与源码在同一 bundle 内维护，并随 `files` 清单分发。

#### Scenario: 每个围栏只渲染一次
- **WHEN** 客户端按 profile 组合启用插件后渲染含 `dot` 围栏的对话
- **THEN** 该围栏只出现一个渲染面板，图形只渲染一次

#### Scenario: 仓库只有一个 Graphviz bundle
- **WHEN** 检查 `bundles/` 目录与 profile 依赖
- **THEN** 只有一个包声明 `conversation.chat.markdown.fence` 的 `dot`、`graphviz`、`gv` 键

#### Scenario: 交付记录随 bundle 分发
- **WHEN** 在仓库根目录执行 `openspec list`，或安装该 bundle 后查看发布内容
- **THEN** 能找到主 specs 与归档变更，且发布清单 `files` 包含 `openspec`

### Requirement: 质量门禁覆盖关键行为

仓库 SHALL 提供可执行的 `typecheck`、单元测试与 `build`，其中单元测试 MUST 覆盖 SVG 安全处理、locale 键一致性、渲染请求去抖/过期丢弃逻辑，以及引擎 chunk 的真实渲染。

#### Scenario: 全部质量门禁通过
- **WHEN** 执行 `pnpm run verify`
- **THEN** 类型检查、测试与构建依次成功

#### Scenario: 引擎 chunk 契约测试
- **WHEN** 测试直接加载引擎 chunk 的导出并渲染示例 DOT
- **THEN** 返回包含 `<svg>` 的输出，证明 chunk 导出契约有效
