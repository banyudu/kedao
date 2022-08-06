
import { classNameParser } from '../../../utils/style'
import React, { FC } from 'react'
import MediaToolbar from '../../../components/MediaToolbar'
import styles from './style.module.scss'
import { BlockRenderProps } from '../../../types'
const cls = classNameParser(styles)

const HorizontalLine: FC<BlockRenderProps> = ({ onRemove }) => {
  return (
    <div className={cls('kedao-hr')}>
      <MediaToolbar className={cls('hr-toolbar')}>
        <a role="presentation" onClick={onRemove}>
          &#xe9ac;
        </a>
      </MediaToolbar>
    </div>
  )
}

export default HorizontalLine
