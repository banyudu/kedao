
import { classNameParser } from '../../utils/style'
import React, { FC } from 'react'
import {
  toggleSelectionLineHeight,
  selectionHasInlineStyle
} from '../../utils'
import { LineHeightPickerProps } from '../../types'
import styles from './style.module.scss'
import { defaultLineHeights } from '../../constants'
import loadable from '@loadable/component'
import useLanguage from '../../hooks/use-language'
const DropDown = loadable(async () => await import('../DropDown'))

const cls = classNameParser(styles)

const LineHeightPicker: FC<LineHeightPickerProps> = ({
  lineHeights = defaultLineHeights,
  defaultCaption,
  getContainerNode,
  onChange,
  onRequestFocus,
  disabled,
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

  const language = useLanguage()

  return (
    <DropDown
      autoHide
      caption={caption || defaultCaption}
      getContainerNode={getContainerNode}
      title={language.controls.lineHeight}
      disabled={disabled}
      ref={dropDownInstance}
      className={cls('kedao-line-height-dropdown')}
    >
      <ul className={cls('kedao-line-heights')}>
        {lineHeights.map((item) => {
          return (
            <li
              key={item}
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
