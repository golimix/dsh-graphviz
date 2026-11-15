# Design

## Context

`GraphvizFence.tsx` 目前把 `sanitizeSvg` 的产物直接塞进 `.dsh-gv-canvas`（`dangerouslySetInnerHTML`），画布用 `display: flex` 居中、SVG 宽高 100%，因此只有「铺满」一种视图。面板本体是 `toolbar + body` 两段，body 高度由 CSS `clamp(420px, 60vh, 760px)` 固定。要加缩放/平移/折叠，只能在不改变 SVG 注入方式与安全边界的前提下，给画布加一层 transform 并管理一个不持久化的视图状态。

## Goals / Non-Goals

**Goals:**
- 五个入口都能缩放：工具栏按钮、滚轮、双击、键盘、拖动（平移）。
- 折叠是纯本地状态，折叠期间不做引擎工作，展开后自动恢复。
- 不改变链接可点击性：拖动结束的那次 click 被吞掉，纯点击仍然打开链接。
- 视觉与交互跟随宿主主题，不引入第二套颜色。

**Non-Goals:**
- 不做图形导出（PNG/PDF）、不做全屏、不做触摸双指手势的专用识别（`touch-action: none` + 拖动已可用）。
- 不把缩放比例持久化到 localStorage，不跨会话记忆折叠态。
- 不改变 SVG 清洗规则与 id 前缀策略。

## Decisions

### 1. 画布内加 transform 层，而不是操作 SVG 属性
新增 `.dsh-gv-canvas-inner` 包裹注入的 SVG，用 `transform: translate(x, y) scale(zoom)` + `transform-origin: 0 0`。相比改 `viewBox`，transform 不触发 Graphviz 重新布局，也不影响 `<a>` 的命中区域；滚动/平移只需更新 CSS，代价是缩放后线条不做矢量重绘（放大到 600% 会有轻微模糊，可接受）。
备选：修改 SVG viewBox（要解析内部坐标，且会与 id 前缀、主题染色逻辑纠缠）。

### 2. 视图状态放在 ref + state 双写
`transformRef` 持有最新值供原生 wheel 监听器与指针手势读取，`zoom`/`pan` 两个 state 供渲染。滚轮监听器用 `addEventListener(..., { passive: false })` 手工挂载并 `preventDefault`，因为 React 的 `onWheel` 在根节点是 passive 的，阻止不了页面滚动。
备选：用 React `onWheel`（无法阻止页面滚动，体验回退到旧问题）。

### 3. 围绕指针缩放
`zoomBy(factor, clientX, clientY)` 先算指针处的图形坐标，再按新比例反算 translate，使指针下的点保持不动；按钮与键盘缩放以视口中心为锚点。范围 25%–600%，每次新图形渲染后重置为 100%。
备选：只按中心缩放（按钮好用，但滚轮体验差）。

### 4. 拖动与链接的冲突用「拖动阈值 + click 吞掉」
指针移动超过 4px 才进入平移，并置 `suppressClickRef`；canvas 的 capture 阶段 click 只要见到该标记就 `preventDefault` + `stopPropagation`。纯点击（未移动）不置标记，`<a>` 正常打开。
备选：拖动时给 SVG 加 `pointer-events: none`（需要额外状态且会闪）。

### 5. 折叠跳过渲染
折叠时 `body` 用 `display: none`，渲染 effect 的依赖里加 `collapsed`，折叠期间直接 return，已排队的 debounce 被 cleanup 取消；展开时 effect 重新执行，自然恢复渲染。折叠按钮带 `aria-expanded`，折叠态工具栏显示「图形已折叠」提示并只保留「展开」。

## Risks / Trade-offs

- [大图放大到 600% 会模糊] → 属 CSS 缩放的固有代价；默认视图与重置都回到 100%。
- [滚轮劫持页面滚动] → 只在指针位于画布内时拦截，且 Ctrl/Meta/Shift+滚轮放行（保留浏览器缩放/横向滚动习惯）。
- [拖动误吞链接点击] → 只有移动超过阈值才吞；双击仍重置视图。
- [折叠后忘记展开导致误以为图没了] → 折叠态工具栏保留「展开」按钮与提示文案。
- [原生监听器与 React 状态不同步] → ref 双写并每次 effect 重建监听器，测试覆盖滚轮缩放。

## Migration Plan

1. 实现组件、样式、i18n 与测试，本地 `pnpm run verify`。
2. 更新 README/DETAIL 的功能说明，版本升到 `0.2.0`。
3. 归档本变更并同步主 spec；需要用新版本时推 `v0.2.0` tag 由 release workflow 发布。
4. 回滚：回退组件与样式提交；spec 与文案一并回退。
