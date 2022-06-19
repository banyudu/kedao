import React, { useState } from 'react'
import './index.css'
import Editor, { EditorState, convertRawToEditorState, convertEditorStateToRaw } from 'kedao'
import { useLocalStorage } from 'react-use'

function Demo () {
  const [value, setValue] = useLocalStorage('kedao-state', convertEditorStateToRaw(EditorState.createEmpty()))
  const [editorState, setEditorState] = useState(convertRawToEditorState(value))

  const handleChange = (newEditorState: EditorState) => {
    setEditorState(newEditorState)
    setValue(convertEditorStateToRaw(newEditorState))
  }

  return (
    <div className="demo">
      <Editor
        value={editorState}
        onChange={handleChange}
      />
    </div>
  )
}

export default Demo
