import React from 'react'
import { showModal } from '../../common/Modal'
import './style.scss'
import { MdClose, MdCode, MdMusicVideo, MdPlayArrow, MdVideocam } from 'react-icons/md'
import { defaultIconProps } from '../../../configs/props'
import { Language } from '../../../types'

const playViaModal = (title: string, component: React.ReactNode, language: Language) =>
  showModal({
    title,
    component,
    language,
    showFooter: false
  })

const iconMap = {
  video: <MdVideocam {...defaultIconProps} />,
  audio: <MdMusicVideo {...defaultIconProps} />,
  embed: <MdCode {...defaultIconProps} />
}

const PlayerModal = ({
  title,
  type,
  language,
  name,
  url,
  poster,
  children,
  onRemove
}) => {
  return (
    <div className={`bf-player-holder ${type}`}>
      <div className="icon-badge">
        {iconMap[type] ?? null}
        <span className="text">{language.media[type]}</span>
      </div>
      <button onMouseDown={onRemove} className="button-remove">
        <MdClose {...defaultIconProps} />
      </button>
      <button
        onMouseDown={() =>
          playViaModal(name ? `${title}:${name}` : title, children, language)
        }
        className="button-play"
      >
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
    </div>
  )
}

export default PlayerModal
