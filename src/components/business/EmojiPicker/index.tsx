import React, { FC } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { CommonPickerProps } from '../../../types'
import { ContentUtils } from '../../../utils'
import DropDown, { DropDownProps } from '../../common/DropDown'
import './style.scss'

export interface EmojiPickerProps extends CommonPickerProps, Pick<DropDownProps, 'getContainerNode'> {
  defaultCaption: DropDownProps['caption']
  emojis: string[]
}

const EmojiPicker: FC<EmojiPickerProps> = ({
  defaultCaption,
  getContainerNode,
  language,
  emojis,
  hooks,
  editor,
  editorState
}) => {
  const insertEmoji = (event) => {
    let emoji = event.currentTarget.dataset.emoji
    const hookReturns = hooks('insert-emoji', emoji)(emoji)

    if (hookReturns === false) {
      return false
    }

    if (typeof hookReturns === 'string') {
      emoji = hookReturns
    }

    editor.setValue(ContentUtils.insertText(editorState, emoji))
    editor.requestFocus()

    return true
  }
  return (
    <DropDown
      caption={defaultCaption}
      autoHide
      showArrow={false}
      getContainerNode={getContainerNode}
      title={language.controls.emoji}
      className="control-item dropdown bf-emoji-dropdown"
    >
      <div className="bf-emojis-wrap">
        <ul className="bf-emojis">
          {emojis.map((item) => {
            return (
              <li
                key={uuidv4()}
                data-emoji={item}
                onClick={(event) => insertEmoji(event)}
                role="presentation"
              >
                {item}
              </li>
            )
          })}
        </ul>
      </div>
    </DropDown>
  )
}

export default EmojiPicker
