
import { classNameParser } from '../../utils/style'
import React, { useRef, FC } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { LetterSpacingPickerProps } from '../../types'
import {
  toggleSelectionLetterSpacing,
  selectionHasInlineStyle
} from '../../utils'
import styles from './style.module.scss'
import loadable from '@loadable/component'
import useLanguage from '../../hooks/use-language'
const DropDown = loadable(async () => await import('../DropDown'))

const cls = classNameParser(styles)

const defaultLetterSpacings = [0, 1, 2, 3, 4, 5, 6]

const LetterSpacingPicker: FC<LetterSpacingPickerProps> = ({
  letterSpacings = defaultLetterSpacings,
  editorState,
  onChange,
  onRequestFocus,
  getContainerNode,
  defaultCaption
}) => {
  let caption = null
  let currentLetterSpacing = null
  const dropDownInstance = useRef(null)

  letterSpacings.find((item) => {
    if (selectionHasInlineStyle(editorState, `LETTERSPACING-${item}`)) {
      caption = item
      currentLetterSpacing = item
      return true
    }
    return false
  })

  const toggleLetterSpacing = (event) => {
    const letterSpacing = event.currentTarget.dataset.size

    onChange(toggleSelectionLetterSpacing(editorState, letterSpacing))
    onRequestFocus()
    return true
  }

  const language = useLanguage()

  return (
    <DropDown
      autoHide
      caption={caption || defaultCaption}
      getContainerNode={getContainerNode}
      title={language.controls.letterSpacing}
      ref={dropDownInstance}
      className={cls('kedao-letter-spacing-dropdown')}
    >
      <ul className={cls('kedao-letter-spacings')}>
        {letterSpacings.map((item) => {
          return (
            <li
              key={uuidv4()}
              role="presentation"
              className={cls(item === currentLetterSpacing ? 'active' : null)}
              data-size={item}
              onClick={(event) => {
                toggleLetterSpacing(event)
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

export default LetterSpacingPicker
