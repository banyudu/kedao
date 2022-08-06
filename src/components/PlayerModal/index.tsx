
import { classNameParser } from '../../utils/style'
import React, { FC, MouseEventHandler, useState } from 'react'
import Modal from '../Modal'
import styles from './style.module.scss'
import { Language } from '../../types'
import Icon from '../Icon'
const cls = classNameParser(styles)

const iconMap = {
  video: <Icon type='videocam' />,
  audio: <Icon type='music-video' />,
  embed: <Icon type='code' />
}

interface PlayerModalProps {
  title: string
  type: keyof typeof iconMap
  language: Language
  name: string
  url: string
  poster: Function
  onRemove: MouseEventHandler
}

const PlayerModal: FC<PlayerModalProps> = ({
  title,
  type,
  language,
  name,
  url,
  poster,
  children,
  onRemove
}) => {
  const [modalVisible, setModalVisible] = useState(false)
  return (
    <div className={cls(`kedao-player-holder ${type}`)}>
      <div className={cls('icon-badge')}>
        {iconMap[type] ?? null}
        <span className={cls('text')}>{language.media[type]}</span>
      </div>
      <button onMouseDown={onRemove} className={cls('button-remove')}>
        <Icon type='close' />
      </button>
      <button onMouseDown={() => setModalVisible(true)} className={cls('button-play')}>
        <Icon type='play-arrow' />
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
        language={language}
        onClose={() => setModalVisible(false)}
        showFooter={false}
      >
        {children}
      </Modal>
    </div>
  )
}

export default PlayerModal
