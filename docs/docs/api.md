---
id: api
title: API
sidebar_position: 2
---

### Props 说明

| 参数                     | 说明               | 类型                                                                | 默认值 |
| ------------------------ | ------------------ | ------------------------------------------------------------------- | ------ |
| value                    | 编辑框内容         | EditorState                                                         | null   |
| defaultValue             | 编辑框默认内容     | EditorState                                                         | null   |
| placeholder              | 占位符             | string                                                              | null   |
| id                       | 唯一标识           | string                                                              | null   |
| editorId                 | 唯一标识           | string                                                              | null   |
| readOnly                 | 只读               | boolean                                                             | false  |
| language                 | 语言               | 'zh'、'zh-hant'、'en'、'tr'、'ru'、'jpn'、'kr'、'pl'、'fr'、'vi-vn' | 'en'   |
| controls                 | 工具栏控件列表     | ControlItem[]                                                       | []     |
| excludeControls          | 排除内置控件列表   | BuiltInControlNames                                                 | []     |
| extendControls           | 扩展控件列表       | ControlItem[]                                                       | []     |
| componentBelowControlBar | 工具栏下方扩展区域 | React.ReactNode                                                     | null   |
| media                    | 媒体选项           | MediaType                                                           | null   |
| imageControls            | 图片操作工具栏     | ImageControlItem[]                                                  | null   |
| imageResizable           | 图片是否可调整尺寸 | boolean                                                             | true   |
| imageEqualRatio          |                    | boolean                                                             | true   |
| blockRenderMap           |                    | Immutable.Map \| Function                                           |        |
| blockRendererFn          |                    | Function                                                            |        |
| customStyleMap           |                    | Immutable.Map \| Function                                           |        |
| customStyleFn            |                    | Function                                                            |        |
| blockStyleFn             |                    | Function                                                            |        |
| keyBindingFn             |                    | Function                                                            |        |
| textBackgroundColor      |                    | boolean                                                             |        |
| allowInsertLinkText      |                    | boolean                                                             | false  |
| stripPastedStyles        |                    | boolean                                                             | false  |
| fixPlaceholder           |                    | boolean                                                             | false  |
| className                | 类名               | string                                                              |        |
| style                    | 内联样式           | React.CSSProperties                                                 | null   |
| controlBarClassName      | 工具栏类名         | string                                                              |        |
| controlBarStyle          | 工具栏内联样式     | React.CSSProperties                                                 | null   |
| contentClassName         | 内容区类名         | string                                                              |        |
| contentStyle             | 内容区内联样式     | React.CSSProperties                                                 | null   |
| onChange                 | 变更回调           | (editorState: EditorState) => void                                  |        |
| onFocus                  | 聚焦回调函数       | Function                                                            |        |
| onBlur                   | 失焦回调函数       | Function                                                            |        |
| onDelete                 |                    | Function                                                            |        |
| onSave                   |                    | Function                                                            |        |
| onFullscreen             |                    | Function                                                            |        |
| handlePastedFiles        |                    | Function                                                            |        |
| handleDroppedFiles       |                    | Function                                                            |        |
| handlePastedText         |                    | Function                                                            |        |
| handleBeforeInput        |                    | Function                                                            |        |
| handleReturn             |                    | Function                                                            |        |
| handleKeyCommand         |                    | Function                                                            |        |
| codeTabIndents           |                    | number                                                              |        |
| disabled                 | 是否禁用           | number                                                              | false  |
| extendAtomics            |                    |                                                                     |        |
