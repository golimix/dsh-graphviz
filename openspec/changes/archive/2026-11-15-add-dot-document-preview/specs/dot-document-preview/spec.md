# Spec Delta

## Purpose

让右侧 Sidebar 的文件预览把 `.dot` 文件渲染成可编辑的 Graphviz 图形，同时保留纯文本查看与只读边界。

## ADDED Requirements

### Requirement: 注册 .dot 文档渲染器

bundle SHALL 通过 `ctx.documentPreviews.register` 注册 `extensions: ['dot']`、`priority: 'extension'`、`loading: 'text-pages'` 的渲染器，并在键控槽 `sidebar.right.tab.document` 以同一 id 注册正文。注册 MUST 由可回收的 effect 持有。渲染器 MUST 在渲染器下拉中与内建纯文本/代码实现并存，MUST NOT 移除或替换纯文本选项。

#### Scenario: 打开 .dot 文件
- **WHEN** 用户从右侧 Sidebar 的文件导航打开一个 `.dot` 文件
- **THEN** 标签页以 Graphviz 图形渲染该文件，且下拉中仍可选择纯文本查看

#### Scenario: 禁用插件后回退
- **WHEN** 插件被禁用或卸载
- **THEN** 渲染器注册被回收，`.dot` 文件回到内建纯文本/代码预览

### Requirement: 正文复用围栏面板能力

文档正文 SHALL 复用围栏面板，提供源码编辑、实时重渲染、TB/LR/仅图形布局、缩放、锁定尺寸、放大查看与折叠；渲染 MUST 使用与围栏相同的引擎加载、SVG 清洗与主题映射。

#### Scenario: 编辑后重渲染
- **WHEN** 用户在以 TB 布局打开的 `.dot` 文件中修改源码
- **THEN** 去抖后图形按新源码更新

#### Scenario: 仅渲染模式
- **WHEN** 用户切换到「仅图形」布局
- **THEN** 编辑器隐藏、图形仍可缩放平移

### Requirement: 编辑为本地草稿且不可写盘

文档正文 MUST NOT 提供保存按钮或写回文件的入口；编辑内容仅存在于标签页内存中。文档 MUST 说明保存需通过 Agent 的文件工具或外部编辑器完成，因为 Sidebar 的文件 API 是只读的。

#### Scenario: 不存在保存入口
- **WHEN** 用户在侧边栏标签页中编辑 `.dot` 源码
- **THEN** 界面不出现保存按钮，文件内容在磁盘上保持不变

#### Scenario: 重新打开文件
- **WHEN** 用户关闭并重新打开同一个 `.dot` 文件
- **THEN** 编辑器显示磁盘上的原始内容，而不是上次的草稿
