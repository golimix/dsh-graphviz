# Proposal

## Why

`bgcolor="#1a1a2e"` 这类自带深色画布的图，在浅色宿主主题下文字被映射成深色前景，整张表看起来“变成黑色”、读不清。旧逻辑无条件把 Graphviz 的黑色墨迹换成宿主前景 token，没有考虑图形自己声明的背景色。

## What Changes

- `sanitizeSvg` 先识别图形自带的背景（`g.graph` 的第一个上色 polygon/rect），有背景时改用固定对比墨迹：浅背景用 `#111827`，深背景用 `#f3f4f6`；没有背景时维持原有的宿主主题 token。
- 文本颜色按“最近的上色祖先 → 几何包含的 cell/形状 → 图形背景”三级解析；Graphviz 的 HTML-like label 把 cell 画成兄弟多边形，因此新增按坐标包含关系的匹配。
- 扩充命名字色表（yellow/green/white 等常见 Graphviz 颜色），避免未知颜色被当成黑色导致对比判断错误。

## Impact

- 改动：`src/client/svg.ts`、`src/tests/svg.test.ts`、`dist/*`。
- 不变：围栏与文档预览行为、安全清洗规则（allowlist、URL/样式拒绝、id 前缀）。
