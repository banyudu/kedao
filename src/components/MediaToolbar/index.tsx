
import { classNameParser } from '../../utils/style'
import React, { FC, forwardRef } from 'react'
import mergeClassNames from 'merge-class-names'
import styles from './style.module.scss'
const cls = classNameParser(styles)

const MediaToolbar: FC<JSX.IntrinsicElements['div']> = forwardRef(
  ({ className, ...props }, ref) => {
    const newClassName = mergeClassNames(className, 'kedao-media-toolbar')
    return <div ref={ref} {...props} className={cls(newClassName)} />
  }
)

export default MediaToolbar
