
import { classNameParser } from '../../utils/style'
import React, { FC } from 'react'
import PlayerModal from '../../components/PlayerModal'
import styles from './style.module.scss'
import { BlockRenderProps } from '../../types'
import useLanguage from '../../hooks/use-language'
const cls = classNameParser(styles)

const Embed: FC<BlockRenderProps> = ({
  mediaData,
  onRemove
}) => {
  const { name, url, meta } = mediaData
  const language = useLanguage()
  return (
    <div className={cls('kedao-embed-wrap')}>
      <PlayerModal
        type="embed"
        onRemove={onRemove}
        poster={meta ? meta.poster || '' : ''}
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
