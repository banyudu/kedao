import React, { FC } from 'react'
import mergeClassNames from 'merge-class-names'
import './style.scss'

interface SwitchProps {
  active: boolean
  onClick: () => any
  className?: string
  label: string
}

const Switch: FC<SwitchProps> = ({ active, onClick, className, label }) => {
  return (
    <div
      className={mergeClassNames(
        'kedao-switch',
        className
      )}
    >
      <div
        className={mergeClassNames('inner-switch', active && 'active')}
        role='presentation'
        onClick={onClick}
      />
      <label>{label}</label>
    </div>
  )
}

export default Switch
