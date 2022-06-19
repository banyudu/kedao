import React, { useState } from 'react'
import './demo.css'
import Editor, {
  EditorState,
  convertRawToEditorState,
  convertEditorStateToRaw
} from 'kedao'
import { useLocalStorage } from 'react-use'
import BrowserOnly from '@docusaurus/BrowserOnly'

function Demo () {
  const [value, setValue] = useLocalStorage(
    'kedao-state',
    convertEditorStateToRaw(EditorState.createEmpty())
  )
  const [editorState, setEditorState] = useState(convertRawToEditorState(value))

  const handleChange = (newEditorState: EditorState) => {
    setEditorState(newEditorState)
    setValue(convertEditorStateToRaw(newEditorState))
  }

  return (
    <BrowserOnly>
      {
        () => (
          <div className='demo'>
            <Editor value={editorState} onChange={handleChange} />
          </div>
        )
      }
    </BrowserOnly>
  )
}

export default Demo
