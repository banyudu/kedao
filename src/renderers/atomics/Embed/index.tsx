import React, { FC } from 'react'
import { removeBlock } from '../../../utils'
import PlayerModal from '../../../components/business/PlayerModal'
import './style.scss'
import { CallbackEditor, EditorState, Language } from '../../../types'

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
    <div className="kedao-embed-wrap">
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
          className="kedao-embed-player"
          dangerouslySetInnerHTML={{ __html: url }}
        />
      </PlayerModal>
    </div>
  )
}

export default Embed
