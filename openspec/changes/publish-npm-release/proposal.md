# Proposal

## Why

bundle 目前只存在于本地工作区，安装方式只有 `link:` 路径，其他人和 CI 都无法消费；发布也靠手工 `npm publish`，容易漏跑质量门禁、发出未构建的 `dist` 或与 tag 不一致的版本号。需要把仓库托管到 GitHub，并用流水线把「验证 → 发布」固定下来：推 `v*` tag 时先跑完整 `verify`，通过后才发布到 npmjs.org 的 `@limix/dsh-graphviz`。

## What Changes

- 包名从 `@local/dsh-graphviz` 改为 `@limix/dsh-graphviz`：`package.json`、`cordis.patch.yml`、`src/shared/contract.ts` 的包 id 与槽注册前缀、测试断言、README/DETAIL 与 OpenSpec 记录同步更新；`dist` 重新构建。
- `package.json` 增加发布元数据：移除 `private`，补 `publishConfig`（`access: public` + npmjs.org registry）、`repository`/`homepage`/`bugs`/`keywords`/`author`，并补 `LICENSE` 文件。
- 新增仓库级 GitHub Actions：`.github/workflows/ci.yml` 在主分支与 PR 上跑 `pnpm run verify`、`dist` 漂移检查与 `openspec validate --all --strict`；`.github/workflows/release.yml` 在 `v*` tag 上重复同一套门禁后执行 `npm publish --access public --provenance`。
- 发布凭据只用仓库 secret `NPM_TOKEN`；workflow 权限固定为 `contents: read` + `id-token: write`（供 provenance 使用）。
- 仓库以 bundle 为根：用 `git subtree split -P bundles/dsh-graphviz` 导出单仓库历史，推送到 `github.com/golimix/dsh-graphviz`，使 clone 下来即可 `pnpm install && pnpm run verify`。

## Capabilities

### New Capabilities

- `release-automation`: 标签驱动的 npm 发布流水线、主分支持续验证门禁、凭据与权限边界，以及发布产物完整性约定。

### Modified Capabilities

_无。`graphviz-bundle-packaging` 的构建与元数据契约不变，仅包名与发布字段随本变更调整。_

## Impact

- 改动：`package.json`、`cordis.patch.yml`、`src/shared/contract.ts`、`src/tests/index.test.ts`、`README.md`、`docs/DETAIL.md`、`dist/*`、OpenSpec 记录。
- 新增：`LICENSE`、`.github/workflows/ci.yml`、`.github/workflows/release.yml`、`openspec/changes/publish-npm-release/**`。
- 外部依赖：GitHub 仓库 `golimix/dsh-graphviz`；npm 账号 `limix` 下的 `@limix/dsh-graphviz`；仓库 secret `NPM_TOKEN`（Automation token，具备 publish 权限）。
- 不变：bundle 的运行时行为、fence 注册、引擎加载与 SVG 安全处理。
