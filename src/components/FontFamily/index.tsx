
import { classNameParser } from '../../utils/style'
import React, { FC } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { CommonPickerProps, FontFamily, Language } from '../../types'
import {
  toggleSelectionFontFamily,
  selectionHasInlineStyle
} from '../../utils'
import DropDown, { DropDownProps } from '../DropDown'
import Menu from '../Menu'
import MenuItem from '../MenuItem'
import styles from './style.module.scss'
const cls = classNameParser(styles)

export interface FontFamilyPickerProps
  extends CommonPickerProps,
  Pick<DropDownProps, 'getContainerNode'> {
  fontFamilies: readonly FontFamily[]
  defaultCaption: DropDownProps['caption']
  language: Language
}

const FontFamilyPicker: FC<FontFamilyPickerProps> = ({
  fontFamilies,
  editorState,
  hooks,
  defaultCaption,
  getContainerNode,
  language,
  onChange,
  onRequestFocus
}) => {
  let caption = null
  let currentIndex = null
  let dropDownInstance = null

  fontFamilies.find((item, index) => {
    if (selectionHasInlineStyle(editorState, `FONTFAMILY-${item.name}`)) {
      caption = item.name
      currentIndex = index
      return true
    }
    return false
  })

  const toggleFontFamily = (event) => {
    let fontFamilyName = event.currentTarget.dataset.name
    const hookReturns = hooks('toggle-font-family', fontFamilyName)(
      fontFamilyName,
      fontFamilies
    )

    if (hookReturns === false) {
      return false
    }

    if (typeof hookReturns === 'string') {
      fontFamilyName = hookReturns
    }

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
              key={uuidv4()}
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
