import React, { FC, forwardRef } from 'react'
import mergeClassNames from 'merge-class-names'
import './style.scss'

const MediaToolbar: FC<JSX.IntrinsicElements['div']> = forwardRef(
  ({ className, ...props }, ref) => {
    const newClassName = mergeClassNames(className, 'kedao-media-toolbar')
    return <div ref={ref} {...props} className={newClassName} />
  }
)

export default MediaToolbar
