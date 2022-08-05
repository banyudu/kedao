import React, { FC, forwardRef } from 'react'
import mergeClassNames from 'merge-class-names'
import './style.scss'

const MenuItem: FC<JSX.IntrinsicElements['li']> = forwardRef(
  ({ className, ...props }, ref) => {
    const newClassName = mergeClassNames(className, 'menu-item')
    return <li ref={ref} {...props} className={newClassName} />
  }
)

export default MenuItem
