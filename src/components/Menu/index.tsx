
import { classNameParser } from '../../utils/style'
import React, { FC, forwardRef } from 'react'
import mergeClassNames from 'merge-class-names'
import styles from './style.module.scss'
const cls = classNameParser(styles)

const Menu: FC<JSX.IntrinsicElements['ul']> = forwardRef(
  ({ className, ...props }, ref) => {
    const newClassName = mergeClassNames(className, 'menu')
    return <ul ref={ref} {...props} className={cls(newClassName)} />
  }
)

export default Menu
