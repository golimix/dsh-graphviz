# Proposal

## Why

文档和界面目前只有中文一种权威版本：README 与 `docs/DETAIL.md` 是中文，英文界面下插件详情页仍显示中文正文；也没有测试保证两种语言同步。需要把文档与 UI 文案按双语最佳实践固化下来，并让插件详情页随宿主语言自动切换。

## What Changes

- README 按惯例拆成英文 `README.md` 与中文 `README.zh.md`，两份都在 H1 后带语言切换行。
- 插件详情文档拆成英文 `docs/DETAIL.md` 与中文 `docs/DETAIL.zh.md`；两种语言的 `locale/*.json` 中 `meta.detail` 分别指向对应文件，详情页随宿主 UI 语言自动切换。
- `README.zh.md` 加入发布的 `files` 清单。
- 新增 `src/tests/docs-i18n.test.ts`：校验 README/DETAIL 双语成对、切换行存在、`meta.detail` 指向真实文件、双语元数据不同、以及 UI 字典键集合一致。
- 界面文案继续走 DSH locale 服务（`en`/`zh` 字典），其他语言回退英文，无需在组件内做语言判断。

## Capabilities

### New Capabilities

_无。_

### Modified Capabilities

- `graphviz-bundle-packaging`: 新增「双语文档与本地化元数据」Requirement。

## Impact

- 改动：`README.md`、`docs/DETAIL.md`、`package.json`、`locale/zh.json`、`locale/en.json`。
- 新增：`README.zh.md`、`docs/DETAIL.zh.md`、`src/tests/docs-i18n.test.ts`。
- 不变：运行时行为、fence 注册、引擎与 SVG 安全处理、OpenSpec 记录语言（仍为中文）。
