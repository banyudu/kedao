import React, { FC } from 'react'
import { EditorMode } from '../../types'
import styles from './style.module.scss'

interface HTMLButtonProps {
  mode: EditorMode
}

const HTMLButton: FC<HTMLButtonProps> = ({ mode }) => {
  const active = mode === 'html'
  const className = active ? styles.active : ''
  return (
    <div className={className}>
      <span>HTML</span>
    </div>
  )
}

export default HTMLButton
