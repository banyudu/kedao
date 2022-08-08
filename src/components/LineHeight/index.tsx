
import { classNameParser } from '../../utils/style'
import React, { FC } from 'react'
import { v4 as uuidv4 } from 'uuid'
import {
  toggleSelectionLineHeight,
  selectionHasInlineStyle
} from '../../utils'
import { CommonPickerProps, EditorState, DropDownProps } from '../../types'
import styles from './style.module.scss'
import { defaultLineHeights } from '../../constants'
import loadable from '@loadable/component'
const DropDown = loadable(async () => await import('../DropDown'))

const cls = classNameParser(styles)

export interface LineHeightPickerProps extends CommonPickerProps {
  lineHeights?: number[]
  defaultCaption: DropDownProps['caption']
  onRequestFocus: () => void
  onChange: (
    editorState: EditorState,
    callback?: (state: EditorState) => void
  ) => void
}

const LineHeightPicker: FC<LineHeightPickerProps> = ({
  lineHeights = defaultLineHeights,
  defaultCaption,
  getContainerNode,
  language,
  onChange,
  onRequestFocus,
  editorState
}) => {
  let caption = null
  let currentLineHeight = null
  const dropDownInstance = React.createRef<any>()

  lineHeights.find((item) => {
    if (selectionHasInlineStyle(editorState, `LINEHEIGHT-${item}`)) {
      caption = item
      currentLineHeight = item
      return true
    }
    return false
  })

  const toggleLineHeight = (event) => {
    const lineHeight = event.currentTarget.dataset.size

    onChange(toggleSelectionLineHeight(editorState, lineHeight))
    onRequestFocus()
    return true
  }

  return (
    <DropDown
      autoHide
      caption={caption || defaultCaption}
      getContainerNode={getContainerNode}
      title={language.controls.lineHeight}
      ref={dropDownInstance}
      className={cls('kedao-line-height-dropdown')}
    >
      <ul className={cls('kedao-line-heights')}>
        {lineHeights.map((item) => {
          return (
            <li
              key={uuidv4()}
              role="presentation"
              className={cls(item === currentLineHeight ? 'active' : null)}
              data-size={item}
              onClick={(event) => {
                toggleLineHeight(event)
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

export default LineHeightPicker
