import React, { useState } from 'react'
import Editor, {
  EditorState,
  convertEditorStateToHTML,
  convertEditorStateToRaw
} from 'kedao'

const Demo = () => {
  const [editorState, setEditorState] = useState(EditorState.createEmpty())

  const handleChange = (newEditorState: EditorState) => {
    setEditorState(newEditorState)
    console.log('raw: ', convertEditorStateToRaw(newEditorState))
    console.log('html: ', convertEditorStateToHTML(newEditorState, {}))
  }
  return (
    <Editor className="demo" value={editorState} onChange={handleChange} />
  )
}

export default Demo
