
import { classNameParser } from '../../utils/style'
import React, { FC, useRef } from 'react'
import { FontSizePickerProps } from '../../types'
import styles from './style.module.scss'
import { defaultFontSizes } from '../../constants'
import useLanguage from '../../hooks/use-language'
import useSelectionInlineStyle from '../../hooks/use-selection-line-style'
import DropDown, { DropDownRef } from '../DropDown'

const cls = classNameParser(styles)

const FontSizePicker: FC<FontSizePickerProps> = ({
  fontSizes = defaultFontSizes,
  defaultCaption,
  getContainerNode,
  editorState,
  onChange,
  disabled,
  onRequestFocus
}) => {
  const dropDownRef = useRef<DropDownRef>(null)

  const {
    value: currentFontSize,
    toggle
  } = useSelectionInlineStyle(editorState, 'FONTSIZE')

  const toggleFontSize = (event) => {
    const fontSize = event.currentTarget.dataset.size

    onChange(toggle(fontSize))
    onRequestFocus()
    return true
  }

  const language = useLanguage()

  return (
    <DropDown
      autoHide
      caption={currentFontSize || defaultCaption}
      getContainerNode={getContainerNode}
      title={language.controls.fontSize}
      disabled={disabled}
      ref={dropDownRef}
      className={cls('kedao-font-size-dropdown')}
    >
      <ul className={cls('kedao-font-sizes')}>
        {fontSizes.map((_item) => {
          const item = String(_item)
          return (
            <li
              key={item}
              role="presentation"
              className={cls(item === currentFontSize ? 'active' : null)}
              data-size={item}
              onClick={(event) => {
                toggleFontSize(event)
                dropDownRef.current?.hide()
              }}
            >
              {item}
            </li>
          )
        })}
      </ul>
    </DropDown>
  )
}

export default FontSizePicker
