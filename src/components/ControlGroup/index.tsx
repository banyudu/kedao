
import { classNameParser } from '../../utils/style'
import React, { FC } from 'react'
import styles from '../ControlBar/style.module.scss'
const cls = classNameParser(styles)

const ControlGroup: FC<{}> = ({ children }) => (
  <div className={cls('control-item-group')}>{children}</div>
)

export default ControlGroup
