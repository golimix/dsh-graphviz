# Tasks

## 1. 包名与发布元数据

- [ ] 1.1 把包名从 `@local/dsh-graphviz` 改为 `@limix/dsh-graphviz`：`package.json`、`cordis.patch.yml`、`src/shared/contract.ts` 的 `PACKAGE_ID`、`src/tests/index.test.ts` 的槽 id 与样式选择器
- [ ] 1.2 `package.json` 移除 `private`，补 `publishConfig`（`access: public`、npmjs registry）、`repository`/`homepage`/`bugs`/`keywords`/`author`；新增 `LICENSE`（MIT）
- [ ] 1.3 重建 `dist` 并验证产物中的注册 id 已是 `@limix/dsh-graphviz`：`node -e` 检查 `dist/client.js` 含新 id

## 2. 流水线

- [ ] 2.1 新增 `.github/workflows/ci.yml`：`main` push 与 PR 上跑 `pnpm install --frozen-lockfile`、`pnpm run verify`、`git diff --exit-code -- dist`、`openspec validate --all --strict`
- [ ] 2.2 新增 `.github/workflows/release.yml`：`push: tags: v*` 触发，校验 tag 与版本一致，`pnpm run verify` + `dist` 漂移检查后 `npm publish --access public --provenance`，`NODE_AUTH_TOKEN` 取自 `secrets.NPM_TOKEN`，权限仅 `contents: read` + `id-token: write`
- [ ] 2.3 本地用 `act` 或逐条命令模拟 workflow 的关键步骤，验证版本校验、门禁与发布命令参数正确

## 3. 仓库导出与推送

- [ ] 3.1 在工作区仓库提交全部改动，`git subtree split -P bundles/dsh-graphviz` 导出以 bundle 为根的临时分支
- [ ] 3.2 创建 `golimix/dsh-graphviz`（公开仓库），推送导出分支为 `main`；验证远端 `main` 的根目录就是 bundle 内容
- [ ] 3.3 在仓库 Settings → Secrets 添加 `NPM_TOKEN`（npm Automation token）

## 4. 首次发布

- [ ] 4.1 在 `main` 上打 `v0.1.0` tag 并推送，观察 Release workflow 通过并发布 `@limix/dsh-graphviz@0.1.0`
- [ ] 4.2 验证 npmjs.org 包页面：版本、`files` 内容、MIT 许可证、repository/homepage 链接与 provenance
- [ ] 4.3 在本地 profile 用 `npm` 源安装一次（`dsh plugin add @limix/dsh-graphviz`），确认与 `link:` 安装表现一致
