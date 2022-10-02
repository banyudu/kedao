
import { classNameParser } from '../../utils/style'
import React, { FC, useRef } from 'react'
import { LineHeightPickerProps } from '../../types'
import styles from './style.module.scss'
import { defaultLineHeights } from '../../constants'
import useLanguage from '../../hooks/use-language'
import useSelectionInlineStyle from '../../hooks/use-selection-line-style'
import DropDown, { DropDownRef } from '../DropDown'

const cls = classNameParser(styles)

const LineHeightPicker: FC<LineHeightPickerProps> = ({
  lineHeights = defaultLineHeights,
  defaultCaption,
  getContainerNode,
  onChange,
  onRequestFocus,
  disabled,
  editorState
}) => {
  const dropDownRef = useRef<DropDownRef>(null)

  const {
    value: currentLineHeight,
    toggle
  } = useSelectionInlineStyle(editorState, 'LINEHEIGHT')

  const toggleLineHeight = (event) => {
    const lineHeight = event.currentTarget.dataset.size

    onChange(toggle(lineHeight))
    onRequestFocus()
    return true
  }

  const language = useLanguage()

  return (
    <DropDown
      autoHide
      caption={currentLineHeight || defaultCaption}
      getContainerNode={getContainerNode}
      title={language.controls.lineHeight}
      disabled={disabled}
      ref={dropDownRef}
      className={cls('kedao-line-height-dropdown')}
    >
      <ul className={cls('kedao-line-heights')}>
        {lineHeights.map((_item) => {
          const item = String(_item)
          return (
            <li
              key={item}
              role="presentation"
              className={cls(item === currentLineHeight ? 'active' : null)}
              data-size={item}
              onClick={(event) => {
                toggleLineHeight(event)
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

export default LineHeightPicker
