import React from 'react'
import Editor, {
  EditorState,
  convertEditorStateToHTML,
  convertEditorStateToRaw
} from 'kedao'

const Demo = () => {
  const controls = [
    {
      key: 'bold',
      text: <b>加粗</b>
    },
    'italic',
    'underline',
    'separator',
    'link',
    'separator',
    'media'
  ]
  const [editorState, setEditorState] = React.useState(
    EditorState.createEmpty()
  )

  const handleChange = (newEditorState: EditorState) => {
    setEditorState(newEditorState)
    console.log('raw: ', convertEditorStateToRaw(newEditorState))
    console.log('html: ', convertEditorStateToHTML(newEditorState, {}))
  }
  return (
    <Editor
      className="demo"
      value={editorState}
      onChange={handleChange}
      controls={controls}
    />
  )
}

export default Demo
