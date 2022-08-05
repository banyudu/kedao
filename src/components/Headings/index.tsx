import React, { FC } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { getHeadings } from '../../configs/maps'
import { CommonPickerProps } from '../../types'
import DropDown from '../DropDown'
import Menu from '../Menu'
import MenuItem from '../MenuItem'
import './style.scss'

export interface HeadingsPickerProps
  extends Omit<CommonPickerProps, 'onChange'> {
  headings: string[]
  current: any
  onChange: (command: string, type: string) => void
}

const HeadingsPicker: FC<HeadingsPickerProps> = ({
  language,
  headings,
  current,
  getContainerNode,
  onChange
}) => {
  const dropDownInstance = React.createRef<any>()

  const innerHeadings = getHeadings(language).filter((item) =>
    headings.includes(item.key)
  )
  const currentHeadingIndex = innerHeadings.findIndex(
    (item) => item.command === current
  )
  const caption = innerHeadings[currentHeadingIndex]
    ? innerHeadings[currentHeadingIndex].title
    : language.controls.normal

  return (
    <DropDown
      caption={caption}
      autoHide
      getContainerNode={getContainerNode}
      title={language.controls.headings}
      arrowActive={currentHeadingIndex === 0}
      ref={dropDownInstance}
      className="headings-dropdown"
    >
      <Menu className="headings-menu">
        {innerHeadings.map((item) => {
          const isActive = current === item.command
          return (
            <MenuItem
              key={uuidv4()}
              role="presentation"
              className={`headings-menu-item${isActive ? ' active' : ''}`}
              onClick={() => {
                onChange(item.command, item.type)
                dropDownInstance.current?.hide()
              }}
            >
              {item.text}
            </MenuItem>
          )
        })}
      </Menu>
    </DropDown>
  )
}

export default HeadingsPicker
