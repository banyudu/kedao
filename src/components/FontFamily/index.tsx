
import { classNameParser } from '../../utils/style'
import React, { FC, useRef } from 'react'
import { FontFamilyPickerProps } from '../../types'
import Menu from '../Menu'
import MenuItem from '../MenuItem'
import styles from './style.module.scss'
import { defaultFontFamilies } from '../../constants'
import useLanguage from '../../hooks/use-language'
import useSelectionInlineStyle from '../../hooks/use-selection-line-style'
import DropDown, { DropDownRef } from '../DropDown'

const cls = classNameParser(styles)

const FontFamilyPicker: FC<FontFamilyPickerProps> = ({
  fontFamilies = defaultFontFamilies,
  editorState,
  defaultCaption,
  getContainerNode,
  disabled,
  onChange,
  onRequestFocus
}) => {
  const dropDownRef = useRef<DropDownRef>(null)
  const language = useLanguage()

  const {
    value: currentFontFamily,
    toggle
  } = useSelectionInlineStyle(editorState, 'FONTFAMILY')

  const toggleFontFamily = (event) => {
    const fontFamilyName = event.currentTarget.dataset.name

    onChange(toggle(fontFamilyName))
    onRequestFocus()
    return true
  }

  return (
    <DropDown
      caption={currentFontFamily || defaultCaption}
      getContainerNode={getContainerNode}
      title={language.controls.fontFamily}
      autoHide
      ref={dropDownRef}
      disabled={disabled}
      className={cls('font-family-dropdown')}
    >
      <Menu>
        {fontFamilies.map((item) => {
          return (
            <MenuItem
              key={item.name}
              role="presentation"
              className={cls(`font-family-item ${
                              item.name === currentFontFamily ? 'active' : ''
                            }`)}
              data-name={item.name}
              onClick={(event) => {
                toggleFontFamily(event)
                dropDownRef.current?.hide()
              }}
            >
              <span style={{ fontFamily: item.family }}>{item.name}</span>
            </MenuItem>
          )
        })}
      </Menu>
    </DropDown>
  )
}

export default FontFamilyPicker
