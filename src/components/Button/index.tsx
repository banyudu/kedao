
import { classNameParser } from '../../utils/style'
import React, { DetailedHTMLProps, FC, ButtonHTMLAttributes } from 'react'
import mergeClassNames from 'merge-class-names'
import styles from './style.module.scss'
const cls = classNameParser(styles)

const Button: FC<
DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>
> = ({ className, ...props }) => {
  const newClassName = mergeClassNames('control-item-button', className)
  return <button {...props} className={cls(newClassName)} />
}

export default Button
