import React, { FC } from 'react'
import { removeBlock } from '../../../utils'
import PlayerModal from '../../../components/business/PlayerModal'
import { CallbackEditor, EditorState, Language } from '../../../types'
import './style.scss'

interface VideoProps {
  mediaData: any
  language: Language
  editor: CallbackEditor
  editorState: EditorState
  block: any
}

const Video: FC<VideoProps> = ({
  mediaData,
  language,
  editor,
  editorState,
  block
}) => {
  const { url, name, meta } = mediaData
  const { poster = '' } = meta

  const removeVideo = () => {
    editor.setValue(removeBlock(editorState, block))
  }

  return (
    <div className="bf-video-wrap">
      <PlayerModal
        type="video"
        onRemove={removeVideo}
        poster={poster}
        language={language}
        url={url}
        name={name}
        title={language.videoPlayer.title}
      >
        <div className="bf-video-player">
          <video controls poster={poster}>
            <source src={url} />
          </video>
        </div>
      </PlayerModal>
    </div>
  )
}

export default Video
