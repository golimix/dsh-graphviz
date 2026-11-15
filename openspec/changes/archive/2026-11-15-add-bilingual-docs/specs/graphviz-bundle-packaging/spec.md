# Spec Delta

## Purpose

让 bundle 的面向用户文档与插件元数据同时提供英文和中文，并随宿主 UI 语言自动切换。

## ADDED Requirements

### Requirement: 双语文档与本地化元数据

仓库 SHALL 同时提供英文 `README.md` 与中文 `README.zh.md`，两者 MUST 在 H1 之后带语言切换行（英文侧 `English | [中文](README.zh.md)`，中文侧 `[English](README.md) | 中文`）。插件详情文档 MUST 拆分为英文 `docs/DETAIL.md` 与中文 `docs/DETAIL.zh.md`，且 MUST NOT 在文档内嵌套语言切换行。`locale/en.json` 与 `locale/zh.json` 的 `meta.detail` MUST 分别指向对应语言的详情文档，使插件详情页随宿主 UI 语言切换。`README.zh.md` MUST 出现在发布的 `files` 清单中。

#### Scenario: 英文界面显示英文详情
- **WHEN** 宿主 UI 语言为 `en` 并在 Plugins 页面打开详情
- **THEN** 详情页显示 `docs/DETAIL.md`，且插件标题与描述来自 `locale/en.json`

#### Scenario: 中文界面显示中文详情
- **WHEN** 宿主 UI 语言为 `zh` 并在 Plugins 页面打开详情
- **THEN** 详情页显示 `docs/DETAIL.zh.md`，且标题与描述来自 `locale/zh.json`

#### Scenario: README 切换语言
- **WHEN** 在 GitHub 或 npm 页面打开 `README.md`
- **THEN** H1 下方有 `[中文](README.zh.md)` 链接，中文侧有回链

#### Scenario: 文档配对由测试保护
- **WHEN** 运行 `pnpm run test`
- **THEN** 双语文档成对、切换行存在、`meta.detail` 指向真实文件等断言全部通过；任一语言缺失或路径错误时测试失败

### Requirement: 界面文案随宿主语言切换

组件可见文案 SHALL 通过 DSH locale 服务注册 `en`/`zh` 字典并由插槽提供的 `t` 座位解析；未提供的其他语言 MUST 回退到内置英文，组件 MUST NOT 自行读取浏览器语言或硬编码中文。

#### Scenario: 其他语言回退英文
- **WHEN** 宿主语言不在 `en`/`zh` 中
- **THEN** 面板显示英文文案而不是中文或空字符串

#### Scenario: 字典键集合一致
- **WHEN** 运行 `pnpm run test`
- **THEN** `en` 与 `zh` 的键集合完全一致，且每个键都有非空文案
