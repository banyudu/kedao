
import { classNameParser } from '../../utils/style'
import React, { FC } from 'react'
import { FontFamilyPickerProps } from '../../types'
import {
  toggleSelectionFontFamily,
  selectionHasInlineStyle
} from '../../utils'
import Menu from '../Menu'
import MenuItem from '../MenuItem'
import styles from './style.module.scss'
import { defaultFontFamilies } from '../../constants'

import loadable from '@loadable/component'
import useLanguage from '../../hooks/use-language'
const DropDown = loadable(async () => await import('../DropDown'))

const cls = classNameParser(styles)

const FontFamilyPicker: FC<FontFamilyPickerProps> = ({
  fontFamilies = defaultFontFamilies,
  editorState,
  defaultCaption,
  getContainerNode,
  onChange,
  onRequestFocus
}) => {
  let caption = null
  let currentIndex = null
  let dropDownInstance = null

  const language = useLanguage()

  fontFamilies.find((item, index) => {
    if (selectionHasInlineStyle(editorState, `FONTFAMILY-${item.name}`)) {
      caption = item.name
      currentIndex = index
      return true
    }
    return false
  })

  const toggleFontFamily = (event) => {
    const fontFamilyName = event.currentTarget.dataset.name

    onChange(toggleSelectionFontFamily(editorState, fontFamilyName))
    onRequestFocus()
    return true
  }

  return (
    <DropDown
      caption={caption || defaultCaption}
      getContainerNode={getContainerNode}
      title={language.controls.fontFamily}
      autoHide
      arrowActive={currentIndex === 0}
      // eslint-disable-next-line no-return-assign
      ref={(instance) => (dropDownInstance = instance)}
      className={cls('font-family-dropdown')}
    >
      <Menu>
        {fontFamilies.map((item, index) => {
          return (
            <MenuItem
              key={item.name}
              role="presentation"
              className={cls(`font-family-item ${
                              index === currentIndex ? 'active' : ''
                            }`)}
              data-name={item.name}
              onClick={(event) => {
                toggleFontFamily(event)
                dropDownInstance.hide()
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
