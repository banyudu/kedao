import React, { useState } from 'react'
import Editor from '../../../src/components/lazy'
import {
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
  return <Editor value={editorState} onChange={handleChange} />
}

export default Demo
