# Spec Delta

## ADDED Requirements

### Requirement: 自带背景色的图形保持可读对比

当 Graphviz 图形声明了 `bgcolor`（`g.graph` 的首个上色 polygon/rect）时，清洗层 SHALL 以该背景决定墨迹颜色：浅背景使用深色墨迹（`#111827`），深背景使用浅色墨迹（`#f3f4f6`），MUST NOT 再无条件套用宿主主题前景 token。未声明背景的图形 MUST 保持原有主题 token 行为。文本取色 MUST 依次尝试最近的上色祖先、按坐标包含的最内层上色形状（覆盖 HTML-like label 的兄弟 cell），最后回退到图形背景。

#### Scenario: 深色画布
- **WHEN** 图形声明 `bgcolor="#1a1a2e"` 且默认黑色文字
- **THEN** 透明 cell 上的文字渲染为浅色 `#f3f4f6`，整图在浅色与深色宿主主题下都清晰可读

#### Scenario: 深色画布上的浅色 cell
- **WHEN** 上述图形里的 cell 声明 `BGCOLOR="yellow"` 且文字为默认黑色
- **THEN** 该 cell 文字渲染为深色 `#111827`，而不是被画布背景带偏成浅色

#### Scenario: 无自带背景
- **WHEN** 图形没有 `bgcolor`
- **THEN** 黑色墨迹仍映射到 `var(--dsw-alias-label-primary, #111827)`，随宿主主题切换
