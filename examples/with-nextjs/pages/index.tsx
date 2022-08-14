import React, { useState } from 'react'
import Editor, { EditorState, convertRawToEditorState, convertEditorStateToRaw } from 'kedao'
import { useLocalStorage } from 'react-use'
import styles from '../styles/Home.module.css'

function App () {
  const [value, setValue] = useLocalStorage('kedao-state', convertEditorStateToRaw(EditorState.createEmpty()))
  const [editorState, setEditorState] = useState(convertRawToEditorState(value))

  const handleChange = (newEditorState: EditorState) => {
    setEditorState(newEditorState)
    setValue(convertEditorStateToRaw(newEditorState))
  }

  return (
    <div className={styles.container}>
      <Editor
        value={editorState}
        onChange={handleChange}
      />
    </div>
  )
}

export default App
