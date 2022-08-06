
import { classNameParser } from '../../../utils/style'
import React, { FC } from 'react'
import PlayerModal from '../../../components/PlayerModal'
import styles from './style.module.scss'
import { BlockRenderProps } from '../../../types'
const cls = classNameParser(styles)

const Embed: FC<BlockRenderProps> = ({
  mediaData,
  onRemove,
  language
}) => {
  const { name, url, meta } = mediaData
  return (
    <div className={cls('kedao-embed-wrap')}>
      <PlayerModal
        type="embed"
        onRemove={onRemove}
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
