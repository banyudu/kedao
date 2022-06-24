import React, { FC } from 'react'
import '../ControlBar/style.scss'

const ControlGroup: FC<{}> = ({ children }) => (
  <div className="control-item-group">{children}</div>
)

export default ControlGroup
