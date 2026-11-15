# Tasks

## 1. 组件与交互

- [x] 1.1 在 `GraphvizFence.tsx` 增加视图状态（zoom/pan）与 transform 层，渲染新图形后自动重置
- [x] 1.2 工具栏加入缩小、百分比重置、放大、重置四个入口，百分比实时显示
- [x] 1.3 以非 passive 原生监听器实现滚轮缩放（围绕指针、拦截页面滚动，Ctrl/Meta/Shift 放行）
- [x] 1.4 指针拖动平移与 4px 阈值，拖动后的 click 在 capture 阶段被吞掉，纯点击仍打开链接
- [x] 1.5 键盘 `+`/`-`/`0`/方向键与双击重置
- [x] 1.6 面板折叠/展开始终可用：折叠隐藏主体、停止并取消渲染，展开恢复；按钮暴露 `aria-expanded`

## 2. 样式与文案

- [x] 2.1 新增 `dsh-gv-canvas-inner`、`dsh-gv-zoomctl`、折叠提示样式，全部使用宿主 token
- [x] 2.2 新增 i18n 键（`zoom.*`、`toolbar.collapse`、`toolbar.expand`、`collapsed.note`），zh/en 键集合一致
- [x] 2.3 更新 `locale/*.json` 的 meta 描述与 `README.md`、`docs/DETAIL.md` 的功能说明

## 3. 验证与发布

- [x] 3.1 新增组件测试：工具栏缩放与重置、键盘缩放、滚轮缩放（含 `defaultPrevented`）、折叠时跳过渲染与展开恢复
- [x] 3.2 `pnpm run verify`（typecheck + 34 个测试 + 构建 + dist 契约）通过
- [x] 3.3 版本升到 `0.2.0` 并重建 `dist`
- [ ] 3.4 归档本变更并同步主 spec，随后按需推 `v0.2.0` tag 触发发布
