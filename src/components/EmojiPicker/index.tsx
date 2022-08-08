
import { classNameParser } from '../../utils/style'
import React, { FC } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { CommonPickerProps, DropDownProps } from '../../types'
import { insertText } from '../../utils'
import styles from './style.module.scss'
import { defaultEmojis } from '../../constants'
import loadable from '@loadable/component'

const DropDown = loadable(async () => await import('../DropDown'))
const cls = classNameParser(styles)

export interface EmojiPickerProps
  extends CommonPickerProps,
  Pick<DropDownProps, 'getContainerNode'> {
  defaultCaption: DropDownProps['caption']
  emojis?: readonly string[]
}

const EmojiPicker: FC<EmojiPickerProps> = ({
  defaultCaption,
  getContainerNode,
  language,
  emojis = defaultEmojis,
  editorState,
  onChange,
  onRequestFocus
}) => {
  const insertEmoji = (event) => {
    const emoji = event.currentTarget.dataset.emoji

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
