import React, { FC } from 'react'
import { EditorMode } from '../../types'
import styles from './style.module.scss'
import HtmlIcon from 'tabler-icons-react/dist/icons/brand-html5'
import { tablerIconProps } from '../../constants'

interface HTMLButtonProps {
  mode: EditorMode
}

const HTMLButton: FC<HTMLButtonProps> = ({ mode }) => {
  const active = mode === 'html'
  const className = active ? styles.active : ''
  return (
    <div className={className}>
      <HtmlIcon {...tablerIconProps} />
    </div>
  )
}

export default HTMLButton
