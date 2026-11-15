# Spec Delta

## Purpose

让 bundle 通过 GitHub Actions 从 tag 自动发布到 npmjs.org，并保证主分支、PR 与发布链路共用同一套质量门禁。

## ADDED Requirements

### Requirement: 标签驱动的 npm 发布

仓库 SHALL 提供 `.github/workflows/release.yml`，在推送 `v*` tag 时触发；发布前 MUST 校验 tag 与 `package.json` 的 `version` 一致（tag 去掉前缀 `v`），不一致时 MUST 失败且不发布。校验通过后 MUST 先运行 `pnpm run verify`，再执行 `npm publish --access public` 发布到 npmjs.org。

#### Scenario: tag 与版本一致时发布
- **WHEN** 维护者推送与 `package.json` 版本一致的 `v0.1.0` tag
- **THEN** workflow 在 `pnpm run verify` 成功后把 `@limix/dsh-graphviz@0.1.0` 发布到 npmjs.org

#### Scenario: tag 与版本不一致时中止
- **WHEN** 推送的 tag 版本与 `package.json` 的 `version` 不同
- **THEN** workflow 在校验步骤失败，不执行 `npm publish`

#### Scenario: 门禁失败不发布
- **WHEN** 类型检查、单元测试、构建或 `dist` 契约检查任一失败
- **THEN** workflow 失败，npm 上不会出现新版本

### Requirement: 主分支与 PR 持续验证

仓库 SHALL 提供 `.github/workflows/ci.yml`，在推送到 `main` 与针对 `main` 的 pull request 时运行 `pnpm run verify`，并 MUST 额外检查两项：重建后的 `dist` 与提交内容一致（`git diff --exit-code -- dist`），以及 `openspec validate --all --strict` 通过。

#### Scenario: PR 阻断 dist 漂移
- **WHEN** PR 修改了源码但没有提交重建后的 `dist`
- **THEN** CI 的漂移检查失败，PR 不能合并

#### Scenario: PR 阻断失效的 OpenSpec
- **WHEN** PR 引入不满足 Requirement 格式或缺少 Scenario 的 spec 变更
- **THEN** CI 的 `openspec validate --all --strict` 失败

### Requirement: 发布凭据与权限边界

发布凭据 SHALL 只来自仓库 secret `NPM_TOKEN`（npm Automation token），MUST NOT 写入仓库文件、日志或 workflow 明文。发布 workflow 的 `permissions` SHALL 限定为 `contents: read` 与 `id-token: write`，MUST NOT 授予写仓库权限；`npm publish` MUST 带 `--provenance` 以生成来源证明（要求仓库公开）。

#### Scenario: 缺少 secret 时失败
- **WHEN** 仓库未配置 `NPM_TOKEN` secret
- **THEN** 发布步骤以鉴权错误失败，且不产生半成品发布

#### Scenario: 生成来源证明
- **WHEN** 发布成功
- **THEN** npm 包页面显示 provenance attestation，指向 `golimix/dsh-graphviz` 与对应 tag

### Requirement: 发布产物完整

包 SHALL 在 `files` 中包含运行时产物 `dist`、`docs`、`locale`、`icon.svg`、`cordis.patch.yml`、`README.md` 与 `openspec`，并 SHALL 附带 `LICENSE` 与指向 `golimix/dsh-graphviz` 的 `repository`/`homepage`/`bugs` 元数据。`publishConfig.access` MUST 为 `public`，registry MUST 为 npmjs.org。

#### Scenario: 发布内容可安装
- **WHEN** 使用者 `npm install @limix/dsh-graphviz`
- **THEN** 包内包含 `dist/index.js`、`dist/client.js`、`dist/client.engine.js`、locale 与 `cordis.patch.yml`，可被 DSH 直接加载

#### Scenario: 包页面可溯源
- **WHEN** 在 npmjs.org 查看该包
- **THEN** 页面显示 GitHub 仓库、主页与 issue 链接，许可证为 MIT
