import React, { FC } from 'react'
import { removeBlock } from '../../../utils'
import { EditorState } from 'draft-js'
import { CallbackEditor } from '../../../types'
import MediaToolbar from '../../../components/MediaToolbar'
import './style.scss'

interface HorizontalLineProps {
  editorState: EditorState
  block: any
  editor: CallbackEditor
}

const HorizontalLine: FC<HorizontalLineProps> = ({
  editorState,
  block,
  editor
}) => {
  const removeHorizontalLine = () => {
    editor.setValue(removeBlock(editorState, block))
  }

  return (
    <div className="kedao-hr">
      <MediaToolbar className="hr-toolbar">
        <a role="presentation" onClick={removeHorizontalLine}>
          &#xe9ac;
        </a>
      </MediaToolbar>
    </div>
  )
}

export default HorizontalLine
