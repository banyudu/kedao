
import { classNameParser } from '../../utils/style'
import React, { FC } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { CommonPickerProps } from '../../types'
import { insertText } from '../../utils'
import DropDown, { DropDownProps } from '../DropDown'
import styles from './style.module.scss'
const cls = classNameParser(styles)

export interface EmojiPickerProps
  extends CommonPickerProps,
  Pick<DropDownProps, 'getContainerNode'> {
  defaultCaption: DropDownProps['caption']
  emojis: string[]
}

const EmojiPicker: FC<EmojiPickerProps> = ({
  defaultCaption,
  getContainerNode,
  language,
  emojis,
  hooks,
  editorState,
  onChange,
  onRequestFocus
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

    onChange(insertText(editorState, emoji))
    onRequestFocus()

    return true
  }
  return (
    <DropDown
      caption={defaultCaption}
      autoHide
      showArrow={false}
      getContainerNode={getContainerNode}
      title={language.controls.emoji}
      className={cls('kedao-emoji-dropdown')}
    >
      <div className={cls('kedao-emojis-wrap')}>
        <ul className={cls('kedao-emojis')}>
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
