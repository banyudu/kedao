import React, { FC } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { ContentUtils } from '../../../utils'
import DropDown, { DropDownProps } from '../../common/DropDown'
import { CommonPickerProps } from '../../../types'
import './style.scss'

export interface LineHeightPickerProps extends CommonPickerProps {
  lineHeights: number[]
  defaultCaption: DropDownProps['caption']
}

const LineHeightPicker: FC<LineHeightPickerProps> = ({ lineHeights, defaultCaption, getContainerNode, language, editor, editorState, hooks }) => {
  let caption = null
  let currentLineHeight = null
  const dropDownInstance = React.createRef<any>()

  lineHeights.find((item) => {
    if (
      ContentUtils.selectionHasInlineStyle(
        editorState,
        `LINEHEIGHT-${item}`
      )
    ) {
      caption = item
      currentLineHeight = item
      return true
    }
    return false
  })

  const toggleLineHeight = (event) => {
    let lineHeight = event.currentTarget.dataset.size
    const hookReturns = hooks('toggle-line-height', lineHeight)(lineHeight)

    if (hookReturns === false) {
      return false
    }

    if (!isNaN(hookReturns)) {
      lineHeight = hookReturns
    }

    editor.setValue(
      ContentUtils.toggleSelectionLineHeight(editorState, lineHeight)
    )
    editor.requestFocus()
    return true
  }

  return (
    <DropDown
      autoHide
      caption={caption || defaultCaption}
      getContainerNode={getContainerNode}
      title={language.controls.lineHeight}
      ref={dropDownInstance}
      className="control-item dropdown bf-line-height-dropdown"
    >
      <ul className="bf-line-heights">
        {lineHeights.map((item) => {
          return (
            <li
              key={uuidv4()}
              role="presentation"
              className={item === currentLineHeight ? 'active' : null}
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
