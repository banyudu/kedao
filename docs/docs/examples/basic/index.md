---
id: example-basic
title: 基本用法
sidebar_position: 1
---

### 功能说明

极简用法。

### 注意事项

- 使用 EditorState.createEmpty() 初始化状态
- 如果需要保存到数据库，可使用 `convertEditorStateToRaw` 将 editorState 转换成普通对象。
- 如果需要导出 html，可使用 `convertEditorStateToHTML` 将 editorState 转换成 HTML。
- editorState 变化比较频繁，可考虑在转换 html 等操作前加节流处理。

### 演示

import Demo from './demo'

<Demo />

<br />

<details>
  <summary>显示源码</summary>

```tsx
import React, { useState } from "react";
import Editor, {
  EditorState,
  convertEditorStateToHTML,
  convertEditorStateToRaw,
} from "kedao";

const Demo = () => {
  const [editorState, setEditorState] = useState(EditorState.createEmpty());

  const handleChange = (newEditorState: EditorState) => {
    setEditorState(newEditorState);
    console.log("raw: ", convertEditorStateToRaw(newEditorState));
    console.log("html: ", convertEditorStateToHTML(newEditorState, {}));
  };
  return (
    <Editor className="demo" value={editorState} onChange={handleChange} />
  );
};

export default Demo;
```

</details>
