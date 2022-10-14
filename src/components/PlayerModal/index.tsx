
import { classNameParser } from '../../utils/style'
import React, { FC, MouseEventHandler, useState } from 'react'
import Modal from '../Modal'
import styles from './style.module.scss'
import useLanguage from '../../hooks/use-language'
import CodeIcon from 'tabler-icons-react/dist/icons/code'
import MovieIcon from 'tabler-icons-react/dist/icons/movie'
import MusicIcon from 'tabler-icons-react/dist/icons/music'
import { tablerIconProps } from '../../constants'
import PlayerPlayIcon from 'tabler-icons-react/dist/icons/player-play'
import XIcon from 'tabler-icons-react/dist/icons/x'

const cls = classNameParser(styles)

const iconMap = {
  video: <MovieIcon {...tablerIconProps} />,
  audio: <MusicIcon {...tablerIconProps} />,
  embed: <CodeIcon {...tablerIconProps} />
}

interface PlayerModalProps {
  title: string
  type: keyof typeof iconMap
  name: string
  url: string
  poster: Function
  onRemove: MouseEventHandler
}

const PlayerModal: FC<PlayerModalProps> = ({
  title,
  type,
  name,
  url,
  poster,
  children,
  onRemove
}) => {
  const [modalVisible, setModalVisible] = useState(false)
  const language = useLanguage()
  return (
    <div className={cls(`kedao-player-holder ${type}`)}>
      <div className={cls('icon-badge')}>
        {iconMap[type] ?? null}
        <span className={cls('text')}>{language.media[type]}</span>
      </div>
      <button onMouseDown={onRemove} className={cls('button-remove')}>
        <XIcon {...tablerIconProps} />
      </button>
      <button onMouseDown={() => setModalVisible(true)} className={cls('button-play')}>
        <PlayerPlayIcon {...tablerIconProps} />
      </button>
      {name ? <h5 className={cls('kedao-name')}>{name}</h5> : null}
      <h6 className={cls('kedao-url')}>{url}</h6>
      {poster
        ? (
        <div
          className={cls('kedao-poster')}
          style={{ backgroundImage: `url(${poster})` }}
        />
          )
        : null}
      <Modal
        visible={modalVisible}
        title={name ? `${title}:${name}` : title}
        onClose={() => setModalVisible(false)}
        showFooter={false}
      >
        {children}
      </Modal>
    </div>
  )
}

export default PlayerModal
