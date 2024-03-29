
import { classNameParser } from '../../utils/style'
import React, { FC, useRef } from 'react'
import { FontSizePickerProps } from '../../types'
import { toggleSelectionFontSize, selectionHasInlineStyle } from '../../utils'
import styles from './style.module.scss'
import { defaultFontSizes } from '../../constants'
import loadable from '@loadable/component'
import useLanguage from '../../hooks/use-language'
const DropDown = loadable(async () => await import('../DropDown'))

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
  let caption = null
  let currentFontSize = null
  const dropDownInstance = useRef(null)

  fontSizes.find((item) => {
    if (selectionHasInlineStyle(editorState, `FONTSIZE-${item}`)) {
      caption = item
      currentFontSize = item
      return true
    }
    return false
  })

  const toggleFontSize = (event) => {
    const fontSize = event.currentTarget.dataset.size

    onChange(toggleSelectionFontSize(editorState, fontSize))
    onRequestFocus()
    return true
  }

  const language = useLanguage()

  return (
    <DropDown
      autoHide
      caption={caption || defaultCaption}
      getContainerNode={getContainerNode}
      title={language.controls.fontSize}
      disabled={disabled}
      ref={dropDownInstance}
      className={cls('kedao-font-size-dropdown')}
    >
      <ul className={cls('kedao-font-sizes')}>
        {fontSizes.map((item) => {
          return (
            <li
              key={item}
              role="presentation"
              className={cls(item === currentFontSize ? 'active' : null)}
              data-size={item}
              onClick={(event) => {
                toggleFontSize(event)
                dropDownInstance.current?.hide()
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
