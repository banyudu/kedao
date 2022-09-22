
import { classNameParser } from '../../utils/style'
import React, { FC } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { EmojiPickerProps } from '../../types'
import { insertText } from '../../utils'
import styles from './style.module.scss'
import { defaultEmojis } from '../../constants'
import loadable from '@loadable/component'
import useLanguage from '../../hooks/use-language'

const DropDown = loadable(async () => await import('../DropDown'))
const cls = classNameParser(styles)

const EmojiPicker: FC<EmojiPickerProps> = ({
  defaultCaption,
  getContainerNode,
  emojis = defaultEmojis,
  editorState,
  onChange,
  disabled,
  onRequestFocus
}) => {
  const insertEmoji = (event) => {
    const emoji = event.currentTarget.dataset.emoji

    onChange(insertText(editorState, emoji))
    onRequestFocus()

    return true
  }

  const language = useLanguage()

  return (
    <DropDown
      caption={defaultCaption}
      autoHide
      showArrow={false}
      getContainerNode={getContainerNode}
      title={language.controls.emoji}
      disabled={disabled}
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
