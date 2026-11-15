# graphviz-fence-rendering Specification

## Purpose
让 Chat 中带 `dot`、`graphviz`、`gv` 语言标记的 Markdown 代码围栏显示为可交互的 SVG 图形，并允许用户查看、编辑源码和切换布局。

## Requirements

### Requirement: 支持三种 Graphviz 围栏语言

客户端 SHALL 为 `dot`、`graphviz`、`gv` 三种 fence 语言注册渲染层；其他语言的围栏 MUST 保持原有代码块行为。围栏内容仍在流式生成时，MUST 显示原始代码块而不是渲染结果。

#### Scenario: 三种语言都渲染
- **WHEN** 对话中出现 ```dot、```graphviz 或 ```gv 围栏且内容已生成完毕
- **THEN** 围栏位置显示渲染后的 Graphviz SVG，而不是纯代码块

#### Scenario: 流式生成期间显示源码
- **WHEN** 围栏内容仍在流式输出（`streaming` 为 true）
- **THEN** 组件显示原始代码块，且不启动 Graphviz 渲染

#### Scenario: 其他语言不受影响
- **WHEN** 围栏语言为 `js`、`mermaid` 或 `text`
- **THEN** 组件不接管该围栏，仍由原有 Markdown 代码块渲染

### Requirement: 渲染结果与源码保持同步

组件 SHALL 在源码变化后延迟一小段时间再渲染，并 MUST 忽略已经过期的渲染结果；渲染期间显示加载状态。渲染失败时 MUST 显示可读的错误信息且不中断对话，下一次源码修改后 MUST 自动重试。

#### Scenario: 编辑后重新渲染
- **WHEN** 用户在编辑器中修改 DOT 源码
- **THEN** 短暂延迟后图形更新为新的渲染结果

#### Scenario: 语法错误
- **WHEN** 输入了非法的 DOT 源码
- **THEN** 面板显示错误信息，先前成功的图形不会被错误信息破坏，修正源码后自动恢复渲染

#### Scenario: 过期结果被丢弃
- **WHEN** 连续快速编辑导致多次渲染先后完成
- **THEN** 只有最后一次源码对应的结果被显示

### Requirement: 提供三种布局模式与可调分隔条

组件 SHALL 提供上图下文（TB）、左右分栏（LR）、仅图形（Graph）三种布局。TB 与 LR 下 MUST 显示可拖动的源码/图形分隔条，并 MUST 支持键盘调整；切换布局后 MUST 保持同一份源码和渲染结果。

#### Scenario: 切换布局
- **WHEN** 用户点击 LR 按钮
- **THEN** 源码与图形变为左右排列，按钮显示选中状态

#### Scenario: 拖动分隔条
- **WHEN** 用户在 TB 模式下向下拖动分隔条
- **THEN** 源码区域增高、图形区域相应缩小，且不超出组件边界

#### Scenario: 键盘调整分隔条
- **WHEN** 焦点位于分隔条且用户按下方向键
- **THEN** 分隔条按固定步长移动，并保持在合理范围内

### Requirement: 源码编辑器遵循宿主主题且可降级

组件 SHALL 在编辑面板中显示可编辑的 DOT 源码，并 MUST 跟随宿主浅色/深色主题切换编辑器主题。编辑器依赖外部 CDN 加载失败时，MUST 降级为可编辑的纯文本输入框，渲染功能仍可使用。

#### Scenario: 深色主题
- **WHEN** 宿主切换到深色主题
- **THEN** 编辑器背景与文字切换为深色配色

#### Scenario: 编辑器加载失败
- **WHEN** Monaco 加载超时或网络不可用
- **THEN** 编辑区域变为普通文本输入框，用户仍能修改源码并触发渲染

### Requirement: SVG 输出必须安全且自适应

渲染结果 SHALL 经过安全处理后才写入页面：MUST 移除脚本、`foreignObject`、事件处理属性和 `javascript:` 链接，并 MUST 让不同图形实例的 id 相互隔离。SVG MUST 根据容器宽度自适应缩放，且保留 Graphviz 生成的链接与文本。

#### Scenario: 恶意内容被移除
- **WHEN** DOT 生成的 SVG 含有 `<script>`、`onclick` 属性或 `javascript:` 链接
- **THEN** 注入页面前的 SVG 中不再包含这些内容

#### Scenario: 多实例 id 隔离
- **WHEN** 同一对话中有两个 Graphviz 图形
- **THEN** 两个 SVG 的内部 id 不冲突，引用仍指向各自图形

#### Scenario: 宽度自适应
- **WHEN** 图形原始宽度大于消息区域宽度
- **THEN** SVG 等比缩小到容器宽度，不出现横向溢出

### Requirement: 可见文案使用客户端 locale

组件可见文案（按钮、加载、错误、空状态、编辑器占位）SHALL 通过客户端 locale 服务提供中英文文案，MUST NOT 在组件中硬编码单一语言。

#### Scenario: 中文界面
- **WHEN** 宿主语言为中文
- **THEN** 工具栏、加载与错误提示显示中文文案

#### Scenario: 英文界面
- **WHEN** 宿主语言为英文
- **THEN** 同一批控件显示英文文案

### Requirement: 图形缩放、平移与重置

面板 SHALL 为渲染完成的图形提供缩放能力：工具栏 MUST 提供缩小、放大与重置入口并显示当前百分比；滚轮 MUST 缩放且 MUST NOT 让页面滚动；双击画布 MUST 重置视图；画布获得焦点后 MUST 支持 `+`/`-`/`0` 与方向键操作。`100%` MUST 表示「适应画布并居中」（按图形 viewBox 等比缩放、整体可见、MUST NOT 裁切高度），缩放比例 MUST 限制在相对 100% 的 25%–600%，且 MUST 围绕指针位置（按钮与键盘以视口中心）缩放。每次渲染出新图形后视图 MUST 重置为 100%。画布 MUST 支持指针拖动平移；拖动后随后的 click MUST 被抑制，纯点击 MUST 仍能打开图形内的链接。

#### Scenario: 工具栏缩放与重置
- **WHEN** 用户点击放大按钮
- **THEN** 百分比从 `100%` 变为 `125%`，图形按比例放大
- **WHEN** 用户点击重置按钮
- **THEN** 百分比回到 `100%`，平移偏移归零

#### Scenario: 滚轮缩放不滚动页面
- **WHEN** 指针位于画布内并滚动滚轮
- **THEN** 图形围绕指针缩放，页面的滚轮事件被 `preventDefault` 拦截

#### Scenario: 键盘与双击
- **WHEN** 画布聚焦后按下 `+`、`-`、`0` 或方向键，或双击画布
- **THEN** 视图相应缩放、重置或平移

#### Scenario: 拖动平移不误触链接
- **WHEN** 用户在画布上按下并拖动超过 4px
- **THEN** 图形跟随平移，松开后不触发拖动起点下的链接
- **WHEN** 用户只在链接上单击而未移动
- **THEN** 链接照常在浏览器中打开

#### Scenario: 新图形重置视图
- **WHEN** 用户修改源码并渲染出新图形
- **THEN** 百分比回到 `100%`，平移偏移归零

### Requirement: 宽度铺满与高度自适应

普通视图 SHALL 按面板宽度等比铺满图形，面板高度 MUST 跟随图形高度（图形高度 = 面板宽度 × viewBox 高宽比），MUST NOT 使用固定高度的内部视窗裁切图形；图形超出屏幕时由聊天区滚动展示。缩放 MUST 在宽度铺满的基础上放大图形并同步增加面板高度；宽度超出面板时 MUST 支持左右拖动查看。

#### Scenario: 默认即铺满宽度
- **WHEN** 图形渲染完成
- **THEN** 图形宽度等于面板可用宽度，面板高度等于图形高度，整图完整显示

#### Scenario: 放大后高度跟随
- **WHEN** 用户放大到 300%
- **THEN** 面板高度按比例增高，图形仍完整可见（不被内部视窗裁切），左右可拖动

### Requirement: 面板折叠

面板 SHALL 提供折叠与展开入口，折叠后 MUST 只保留工具栏并隐藏图形与编辑器区域，工具栏 MUST 显示折叠提示与「展开」按钮。折叠期间面板 MUST NOT 调用 Graphviz 引擎，已排队的渲染 MUST 被取消；展开后 MUST 自动恢复渲染。折叠按钮 MUST 暴露 `aria-expanded` 状态。

#### Scenario: 折叠隐藏并停渲染
- **WHEN** 用户点击折叠
- **THEN** 面板主体隐藏，工具栏只显示展开入口与提示，引擎不再被调用

#### Scenario: 折叠期间改源码
- **WHEN** 面板处于折叠态且源码发生变化
- **THEN** 不触发渲染；展开后按最新源码渲染一次

#### Scenario: 展开恢复
- **WHEN** 用户在折叠态点击展开
- **THEN** 主体恢复显示，图形按当前源码重新渲染

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
