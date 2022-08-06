
import { classNameParser } from '../../utils/style'
import React, { useRef, FC } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { CommonPickerProps, EditorState } from '../../types'
import {
  toggleSelectionLetterSpacing,
  selectionHasInlineStyle
} from '../../utils'
import DropDown, { DropDownProps } from '../DropDown'
import styles from './style.module.scss'
const cls = classNameParser(styles)

export interface LetterSpacingPickerProps extends CommonPickerProps {
  letterSpacings: number[]
  defaultCaption: DropDownProps['caption']
  onRequestFocus: () => void
  onChange: (
    editorState: EditorState,
    callback?: (state: EditorState) => void
  ) => void
}

const LetterSpacingPicker: FC<LetterSpacingPickerProps> = ({
  letterSpacings,
  hooks,
  editorState,
  onChange,
  onRequestFocus,
  getContainerNode,
  language,
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
    let letterSpacing = event.currentTarget.dataset.size
    const hookReturns = hooks(
      'toggle-letter-spacing',
      letterSpacing
    )(letterSpacing)

    if (hookReturns === false) {
      return false
    }

    if (!isNaN(hookReturns)) {
      letterSpacing = hookReturns
    }

    onChange(toggleSelectionLetterSpacing(editorState, letterSpacing))
    onRequestFocus()
    return true
  }

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