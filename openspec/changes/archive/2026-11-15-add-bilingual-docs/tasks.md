# Tasks

## 1. 文档双语

- [x] 1.1 `README.md` 改为英文并保留 H1 语言切换行，新增 `README.zh.md`（中文 + 回链）
- [x] 1.2 `docs/DETAIL.md` 改为英文，新增 `docs/DETAIL.zh.md`（中文，无文档内切换行）
- [x] 1.3 `package.json` 的 `files` 加入 `README.zh.md`

## 2. 元数据与回退

- [x] 2.1 `locale/en.json` 的 `meta.detail` 指向 `docs/DETAIL.md`，`locale/zh.json` 指向 `docs/DETAIL.zh.md`
- [x] 2.2 复核组件只通过 locale 座位取文案，其他语言回退英文（`translate` 缺省 `en`）

## 3. 测试与发布

- [x] 3.1 新增 `src/tests/docs-i18n.test.ts`：双语成对、切换行、`meta.detail` 真实存在、双语元数据不同
- [x] 3.2 `pnpm run verify`（typecheck + 41 个测试 + 构建 + dist 契约）通过
- [ ] 3.3 归档本变更并按需发布新版本
