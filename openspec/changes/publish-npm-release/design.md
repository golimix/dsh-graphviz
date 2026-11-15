# Design

## Context

bundle 以单仓库形式交付：仓库根就是 `package.json` 所在目录，`dist/` 提交进 git 以便 `link:` 安装，`openspec/` 与源码同目录。发布目标是 npmjs.org 上 `limix` 作用域下的包；GitHub 仓库为 `golimix/dsh-graphviz`。CI 环境是 GitHub Actions 的 `ubuntu-latest`，包管理用 pnpm（lockfile v9，本地 pnpm 11.28.5）。

## Goals / Non-Goals

**Goals:**
- 一条可重复的发布路径：tag → 门禁 → npm publish，失败不发布。
- 主分支与 PR 有持续验证，阻断 `dist` 漂移与 openspec 失效。
- 凭据只存在 GitHub secret，权限最小化，并保留 npm provenance 来源证明。
- 仓库自包含：clone 后无需额外上下文即可构建、测试、校验。

**Non-Goals:**
- 不做自动版本号 bump 或 changelog 生成（版本由人工决定后打 tag）。
- 不发布 `@limix` 作用域之外的其他包，不做多包 monorepo 发布。
- 不配置 npm Trusted Publishing（OIDC）；首包与后续都用 `NPM_TOKEN`。
- 不做 GitHub Release 页面自动化。

## Decisions

### 1. tag 驱动，版本号必须与 tag 一致
`release.yml` 只在 `push: tags: v*` 时触发；首个步骤比较 `${GITHUB_REF_NAME#v}` 与 `package.json` 的 `version`，不一致直接失败。这样版本号只有一个事实来源，避免「tag v0.2.0 却发了 0.1.0」。
备选：push 到 main 自动发布（会把每次合并都变成发布，噪声大）、Release published 触发（多一步网页操作）。

### 2. 发布前后各一道门禁
发布前跑 `pnpm run verify`（typecheck → vitest → build → dist 契约），随后 `git diff --exit-code -- dist` 证明提交的 `dist` 与源码一致；两者都过了才 `npm publish`。CI（`ci.yml`）在主分支与 PR 上跑同一套加 `openspec validate --all --strict`。
备选：只在 release 里跑测试（PR 阶段发现问题太晚）；只做 `dist` 检查（覆盖不到渲染契约）。

### 3. 凭据与权限
`NPM_TOKEN` 是 npm Automation token，存于仓库 secret，通过 `actions/setup-node` 的 `registry-url` 写入 `.npmrc`，`NODE_AUTH_TOKEN` 注入到 publish 步骤。workflow 权限固定 `contents: read` + `id-token: write`（provenance 需要 OIDC token），不授予写仓库权限。`npm publish --provenance` 要求仓库公开，私有仓库需去掉该参数。
备选：Trusted Publishing（无 secret，但首包必须先手工发布并绑定 workflow）；长期 token（泄漏面更大）。

### 4. 单仓库历史导出
用 `git subtree split -P bundles/dsh-graphviz -b <branch>` 从工作区仓库导出以 bundle 为根的历史，推送到 `golimix/dsh-graphviz` 的 `main`，保留 `git log`/`blame`，避免把工作区其他内容带进公开仓库。
备选：直接 push 整个工作区（会把无关 bundle、素材与子模块一并公开）；拷贝文件重开仓库（丢历史）。

### 5. 包作用域与元数据
`@limix/dsh-graphviz` 的 scope 与 npm 用户 `limix` 一致，无需组织；`publishConfig` 固定 `access: public` 与 npmjs registry，避免误发到其他 registry 或变成私有包。`repository`/`homepage`/`bugs` 指向 `golimix/dsh-graphviz`，npm 页面可直接跳转。

## Risks / Trade-offs

- [`NPM_TOKEN` 泄漏或过期] → 只用 Automation token、只存 secret、权限最小；失效时发布步骤失败并可重跑 tag。
- [provenance 在私有仓库失败] → 仓库设为 public；若改私有，去掉 `--provenance`。
- [tag 与版本不一致导致发布失败] → 失败即中止，修正 `package.json` 后重新打 tag。
- [subtree split 的分支名与远端冲突] → 使用临时分支名导出，推送后删除本地分支。
- [CI 装 pnpm 11 与本地版本不一致] → lockfile 为 v9，`--frozen-lockfile` 保证依赖一致；升级 pnpm 时同步 workflow 版本。

## Migration Plan

1. 改包名与 `package.json` 发布字段，重建 `dist`，本地 `pnpm run verify`。
2. 加 `ci.yml` / `release.yml` 与 `LICENSE`，提交到工作区仓库 `master`。
3. 导出 subtree 分支，创建 `golimix/dsh-graphviz` 并推送 `main`；在仓库 Settings 添加 `NPM_TOKEN` secret。
4. 打并推 `v0.1.0` tag，观察 Release workflow 成功发布 `@limix/dsh-graphviz@0.1.0`。
5. 回滚：删除远端 tag、`npm unpublish`（72 小时内）或发补丁版本；workflow 可整体回退。

## Open Questions

_无。仓库归属、npm 作用域、鉴权方式与触发条件已由用户确认。_
