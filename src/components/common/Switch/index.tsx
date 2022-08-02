import React, { FC } from 'react'
import mergeClassNames from 'merge-class-names'
import './style.scss'

interface SwitchProps {
  active: boolean
  onClick: () => any
  className?: string
}

const Switch: FC<SwitchProps> = ({ active, onClick, className }) => {
  return (
    <div
      role="presentation"
      onClick={onClick}
      className={mergeClassNames('bf-switch', className, active && 'active')}
    />
  )
}

export default Switch
