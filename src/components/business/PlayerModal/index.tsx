import React, { FC, MouseEventHandler, useState } from 'react'
import Modal from '../../common/Modal'
import './style.scss'
import {
  MdClose,
  MdCode,
  MdMusicVideo,
  MdPlayArrow,
  MdVideocam
} from 'react-icons/md'
import { defaultIconProps } from '../../../configs/props'
import { Language } from '../../../types'

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
    <div className={`bf-player-holder ${type}`}>
      <div className="icon-badge">
        {iconMap[type] ?? null}
        <span className="text">{language.media[type]}</span>
      </div>
      <button onMouseDown={onRemove} className="button-remove">
        <MdClose {...defaultIconProps} />
      </button>
      <button onMouseDown={() => setModalVisible(true)} className="button-play">
        <MdPlayArrow {...defaultIconProps} />
      </button>
      {name ? <h5 className="bf-name">{name}</h5> : null}
      <h6 className="bf-url">{url}</h6>
      {poster
        ? (
        <div
          className="bf-poster"
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
