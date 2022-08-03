import React, { DetailedHTMLProps, FC, ButtonHTMLAttributes } from 'react'
import mergeClassNames from 'merge-class-names'
import './style.scss'

const Button: FC<
DetailedHTMLProps<ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>
> = ({ className, ...props }) => {
  const newClassName = mergeClassNames('control-item-button', className)
  return <button {...props} className={newClassName} />
}

export default Button
