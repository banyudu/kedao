import React, { FC, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { CommonPickerProps } from '../../../types'
import { ContentUtils } from '../../../utils'
import DropDown, { DropDownProps } from '../../common/DropDown'
import './style.scss'

export interface FontSizePickerProps extends CommonPickerProps {
  defaultCaption: DropDownProps['caption']
  fontSizes: number[]
}

const FontSizePicker: FC<FontSizePickerProps> = ({
  fontSizes,
  defaultCaption,
  getContainerNode,
  language,
  hooks,
  editor,
  editorState
}) => {
  let caption = null
  let currentFontSize = null
  const dropDownInstance = useRef(null)

  fontSizes.find((item) => {
    if (
      ContentUtils.selectionHasInlineStyle(
        editorState,
        `FONTSIZE-${item}`
      )
    ) {
      caption = item
      currentFontSize = item
      return true
    }
    return false
  })

  const toggleFontSize = (event) => {
    let fontSize = event.currentTarget.dataset.size
    const hookReturns = hooks('toggle-font-size', fontSize)(fontSize)

    if (hookReturns === false) {
      return false
    }

    if (!isNaN(fontSize)) {
      fontSize = hookReturns
    }

    editor.setValue(
      ContentUtils.toggleSelectionFontSize(editorState, fontSize)
    )
    editor.requestFocus()
    return true
  }

  return (
    <DropDown
      autoHide
      caption={caption || defaultCaption}
      getContainerNode={getContainerNode}
      title={language.controls.fontSize}
      ref={dropDownInstance}
      className="control-item dropdown bf-font-size-dropdown"
    >
      <ul className="bf-font-sizes">
        {fontSizes.map((item) => {
          return (
            <li
              key={uuidv4()}
              role="presentation"
              className={item === currentFontSize ? 'active' : null}
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
