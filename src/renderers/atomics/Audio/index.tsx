import React, { FC } from 'react'
import { removeBlock } from '../../../utils'
import PlayerModal from '../../../components/business/PlayerModal'
import { CallbackEditor, EditorState, Language } from '../../../types'
import './style.scss'

interface AudioProps {
  mediaData: any
  language: Language
  editor: CallbackEditor
  editorState: EditorState
  block: any
}

const Audio: FC<AudioProps> = ({
  mediaData,
  language,
  editor,
  editorState,
  block
}) => {
  const { url, name, meta } = mediaData
  const removeAudio = () => {
    editor.setValue(removeBlock(editorState, block))
  }

  return (
    <div className="kedao-audio-wrap">
      <PlayerModal
        type="audio"
        onRemove={removeAudio}
        poster={meta ? meta.poster || '' : ''}
        language={language}
        url={url}
        name={name}
        title={language.audioPlayer.title}
      >
        <div className="kedao-audio-player">
          <audio controls src={url} />
        </div>
      </PlayerModal>
    </div>
  )
}

export default Audio
