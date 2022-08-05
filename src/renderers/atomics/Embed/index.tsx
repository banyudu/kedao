
import { classNameParser } from '../../../utils/style'
import React, { FC } from 'react'
import { removeBlock } from '../../../utils'
import PlayerModal from '../../../components/PlayerModal'
import styles from './style.module.scss'
import { CallbackEditor, EditorState, Language } from '../../../types'
const cls = classNameParser(styles)

interface EmbedProps {
  mediaData: any
  language: Language
  editor: CallbackEditor
  editorState: EditorState
  block: any
}

const Embed: FC<EmbedProps> = ({
  mediaData,
  language,
  editor,
  editorState,
  block
}) => {
  const { name, url, meta } = mediaData

  const removeEmbed = () => {
    editor.setValue(removeBlock(editorState, block))
  }
  return (
    <div className={cls('kedao-embed-wrap')}>
      <PlayerModal
        type="embed"
        onRemove={removeEmbed}
        poster={meta ? meta.poster || '' : ''}
        language={language}
        url={url}
        name={name}
        title={language.videoPlayer.embedTitle}
      >
        <div
          className={cls('kedao-embed-player')}
          dangerouslySetInnerHTML={{ __html: url }}
        />
      </PlayerModal>
    </div>
  )
}

export default Embed
