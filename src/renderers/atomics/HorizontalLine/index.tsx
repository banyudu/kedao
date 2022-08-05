
import { classNameParser } from '../../../utils/style'
import React, { FC } from 'react'
import { removeBlock } from '../../../utils'
import { EditorState } from 'draft-js'
import { CallbackEditor } from '../../../types'
import MediaToolbar from '../../../components/MediaToolbar'
import styles from './style.module.scss'
const cls = classNameParser(styles)

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
    <div className={cls('kedao-hr')}>
      <MediaToolbar className={cls('hr-toolbar')}>
        <a role="presentation" onClick={removeHorizontalLine}>
          &#xe9ac;
        </a>
      </MediaToolbar>
    </div>
  )
}

export default HorizontalLine
