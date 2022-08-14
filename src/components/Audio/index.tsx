
import { classNameParser } from '../../utils/style'
import React, { FC } from 'react'
import PlayerModal from '../PlayerModal'
import { BlockRenderProps } from '../../types'
import styles from './style.module.scss'
import useLanguage from '../../hooks/use-language'
const cls = classNameParser(styles)

const Audio: FC<BlockRenderProps> = ({
  mediaData,
  onRemove
}) => {
  const { url, name, meta } = mediaData
  const language = useLanguage()

  return (
    <div className={cls('kedao-audio-wrap')}>
      <PlayerModal
        type="audio"
        onRemove={onRemove}
        poster={meta ? meta.poster || '' : ''}
        url={url}
        name={name}
        title={language.audioPlayer.title}
      >
        <div className={cls('kedao-audio-player')}>
          <audio controls src={url} />
        </div>
      </PlayerModal>
    </div>
  )
}

export default Audio
