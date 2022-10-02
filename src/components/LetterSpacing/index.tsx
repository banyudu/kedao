
import { classNameParser } from '../../utils/style'
import React, { useRef, FC } from 'react'
import { LetterSpacingPickerProps } from '../../types'
import styles from './style.module.scss'
import useLanguage from '../../hooks/use-language'
import useSelectionInlineStyle from '../../hooks/use-selection-line-style'
import DropDown, { DropDownRef } from '../DropDown'

const cls = classNameParser(styles)

const defaultLetterSpacings = [0, 1, 2, 3, 4, 5, 6]

const LetterSpacingPicker: FC<LetterSpacingPickerProps> = ({
  letterSpacings = defaultLetterSpacings,
  editorState,
  onChange,
  onRequestFocus,
  getContainerNode,
  disabled,
  defaultCaption
}) => {
  const dropDownRef = useRef<DropDownRef>(null)

  const {
    value: currentLetterSpacing,
    toggle
  } = useSelectionInlineStyle(editorState, 'LETTERSPACING')

  const toggleLetterSpacing = (event) => {
    const letterSpacing = event.currentTarget.dataset.size

    onChange(toggle(letterSpacing))
    onRequestFocus()
    return true
  }

  const language = useLanguage()

  return (
    <DropDown
      autoHide
      caption={currentLetterSpacing || defaultCaption}
      getContainerNode={getContainerNode}
      disabled={disabled}
      title={language.controls.letterSpacing}
      ref={dropDownRef}
      className={cls('kedao-letter-spacing-dropdown')}
    >
      <ul className={cls('kedao-letter-spacings')}>
        {letterSpacings.map((_item) => {
          const item = String(_item)
          return (
            <li
              key={item}
              role="presentation"
              className={cls(item === currentLetterSpacing ? 'active' : null)}
              data-size={item}
              onClick={(event) => {
                toggleLetterSpacing(event)
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

export default LetterSpacingPicker
