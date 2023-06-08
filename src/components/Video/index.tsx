
import { classNameParser } from '../../utils/style'
import React, { FC } from 'react'
import PlayerModal from '../../components/PlayerModal'
import { BlockRenderProps } from '../../types'
import styles from './style.module.scss'
import useLanguage from '../../hooks/use-language'
const cls = classNameParser(styles)

const Video: FC<BlockRenderProps> = ({
  mediaData,
  onRemove
}) => {
  const { url, name, meta } = mediaData ?? {}
  const { poster = '' } = meta ?? {}

  const language = useLanguage()

  return (
    <div className={cls('kedao-video-wrap')}>
      <PlayerModal
        type="video"
        onRemove={onRemove}
        poster={poster}
        url={url}
        name={name}
        title={language.videoPlayer.title}
      >
        <div className={cls('kedao-video-player')}>
          <video controls poster={poster}>
            <source src={url} />
          </video>
        </div>
      </PlayerModal>
    </div>
  )
}

export default Video
