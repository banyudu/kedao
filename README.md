# Kedao（刻刀） 编辑器

kedao 是一个基于 [braft-editor](https://github.com/margox/braft-editor) 修改而来的前端编辑器，底层基于 [draft-js](https://github.com/facebook/draft-js)。

在 Braft-Editor 的基础之上，kedao 做了一些改进工作，如：

1. 重构了 braft-editor 的多个工程，合并成一个大工程，并修改构建产物，从原来的 webpack 打包后的 bundle，改成源码打包。
1. 升级了依赖包和工具链的版本。
1. 改成 Typescript 语言，添加类型定义，方便使用。

## 安装

```bash
npm i kedao
```

## 使用

```jsx
import React, { useState } from "react";
import Editor, {
  EditorState,
  convertRawToEditorState,
  convertEditorStateToRaw,
} from "kedao";
import { useLocalStorage } from "react-use";

function App() {
  const [value, setValue] = useLocalStorage(
    "kedao-state",
    convertEditorStateToRaw(EditorState.createEmpty())
  );

  const [editorState, setEditorState] = useState(
    convertRawToEditorState(value)
  );

  const handleChange = (newEditorState: EditorState) => {
    setEditorState(newEditorState);
    setValue(convertEditorStateToRaw(newEditorState));
  };

  return (
    <div className="App">
      <Editor value={editorState} onChange={handleChange} />
    </div>
  );
}

export default App;
```

## 贡献

欢迎任何方式的贡献，issue、文档、翻译等。

## TODO

- [ ] 完善 Typescript 类型定义
- [ ] 输出 scss 改成 css
- [ ] 添加更多的 demo
- [ ] 输出与 Braft-Editor 的指标对比和迁移指南
