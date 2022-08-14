
import { classNameParser } from '../../utils/style'
import React, { FC } from 'react'
import mergeClassNames from 'merge-class-names'
import styles from './style.module.scss'
const cls = classNameParser(styles)

interface SwitchProps {
  active: boolean
  onClick: () => any
  className?: string
  label: string
}

const Switch: FC<SwitchProps> = ({ active, onClick, className, label }) => {
  return (
    <div
      className={cls(mergeClassNames(
        'kedao-switch',
        className
      ))}
    >
      <div
        className={cls(mergeClassNames('inner-switch', active && 'active'))}
        role='presentation'
        onClick={onClick}
      />
      <label>{label}</label>
    </div>
  )
}

export default Switch
