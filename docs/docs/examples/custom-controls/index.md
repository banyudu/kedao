---
id: example-custom-controls
title: 自定义控件
sidebar_position: 2
---

### 功能说明

kedao 中提供了一组默认工具栏按钮，支持一定程度的自定义。

- controls 设置工具栏按钮白名单
- excludeControls 设置工具栏按钮黑名单

`controls / excludeControls` 的数据类型是 string | { key: string, ...rest } 的类型，如

```js
const controls = [
  {
    key: "bold",
    text: <b>加粗</b>,
  },
  "italic",
  "underline",
  "separator",
  "link",
  "separator",
  "media",
];
```

### 注意事项

- 如果仅隐藏个别操作按钮，使用 excludeControls 更方便
- 只可以指定内置的 key，详见 [API 说明](../../api)

### 演示

import Demo from './demo'

<Demo />

<br />

<details>
  <summary>显示源码</summary>

```tsx
import React from "react";
import Editor, {
  EditorState,
  convertEditorStateToHTML,
  convertEditorStateToRaw,
} from "kedao";

const Demo = () => {
  const controls = [
    {
      key: "bold",
      text: <b>加粗</b>,
    },
    "italic",
    "underline",
    "separator",
    "link",
    "separator",
    "media",
  ];
  const [editorState, setEditorState] = React.useState(
    EditorState.createEmpty()
  );

  const handleChange = (newEditorState: EditorState) => {
    setEditorState(newEditorState);
    console.log("raw: ", convertEditorStateToRaw(newEditorState));
    console.log("html: ", convertEditorStateToHTML(newEditorState, {}));
  };
  return (
    <Editor value={editorState} onChange={handleChange} controls={controls} />
  );
};

export default Demo;
```

</details>
