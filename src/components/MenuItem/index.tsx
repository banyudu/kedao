
import { classNameParser } from '../../utils/style'
import React, { FC, forwardRef } from 'react'
import mergeClassNames from 'merge-class-names'
import styles from './style.module.scss'
const cls = classNameParser(styles)

const MenuItem: FC<JSX.IntrinsicElements['li']> = forwardRef(
  ({ className, ...props }, ref) => {
    const newClassName = mergeClassNames(className, 'menu-item')
    return <li ref={ref} {...props} className={cls(newClassName)} />
  }
)

export default MenuItem
