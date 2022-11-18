import React, { useState } from "react";
import "./App.css";
import Editor, {
  EditorState,
  convertRawToEditorState,
  convertEditorStateToRaw,
} from "kedao";
import { useLocalStorage } from "react-use";
import { PictureInPicture } from "tabler-icons-react";

const ImageUpload = (props: any) => {
  console.log(props);
  return (
    <button
      type="button"
      className="control-item-button style_control-item-button__JqaQX"
      data-title="上传图片"
      disabled={props.disabled}
    >
      <PictureInPicture />
    </button>
  );
};

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
      <Editor
        language="en"
        value={editorState}
        onChange={handleChange}
        extendControls={
          [
            {
              type: "component",
              key: "uploader",
              component: ImageUpload,
            },
          ] as any
        }
      />
    </div>
  );
}

export default App;
