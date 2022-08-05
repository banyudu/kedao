import React, { FC, forwardRef } from 'react'
import mergeClassNames from 'merge-class-names'
import './style.scss'

const Menu: FC<JSX.IntrinsicElements['ul']> = forwardRef(
  ({ className, ...props }, ref) => {
    const newClassName = mergeClassNames(className, 'menu')
    return <ul ref={ref} {...props} className={newClassName} />
  }
)

export default Menu
