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
