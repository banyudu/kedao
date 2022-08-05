
import { classNameParser } from '../../utils/style'
import React, { FC, MouseEventHandler, useState } from 'react'
import Modal from '../Modal'
import styles from './style.module.scss'
import {
  MdClose,
  MdCode,
  MdMusicVideo,
  MdPlayArrow,
  MdVideocam
} from 'react-icons/md'
import { defaultIconProps } from '../../configs/props'
import { Language } from '../../types'
const cls = classNameParser(styles)

const iconMap = {
  video: <MdVideocam {...defaultIconProps} />,
  audio: <MdMusicVideo {...defaultIconProps} />,
  embed: <MdCode {...defaultIconProps} />
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
        <MdClose {...defaultIconProps} />
      </button>
      <button onMouseDown={() => setModalVisible(true)} className={cls('button-play')}>
        <MdPlayArrow {...defaultIconProps} />
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
