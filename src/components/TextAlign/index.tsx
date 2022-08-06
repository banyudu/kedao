
import { classNameParser } from '../../utils/style'
import React, { useState, useEffect, FC } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { getSelectionBlockData, toggleSelectionAlignment } from '../../utils'
import mergeClassNames from 'merge-class-names'
import ControlGroup from '../ControlGroup'
import { CommonPickerProps } from '../../types'
import styles from '../ControlBar/style.module.scss'
import Button from '../Button'
import Icon from '../Icon'
const cls = classNameParser(styles)

const iconMap = {
  left: <Icon type='format-align-left' />,
  center: <Icon type='format-align-center' />,
  right: <Icon type='format-align-right' />,
  justify: <Icon type='format-align-justify' />
}

export interface TextAlignProps extends CommonPickerProps {
  textAligns: string[]
}

const TextAlign: FC<TextAlignProps> = ({
  editorState,
  textAligns,
  onChange,
  onRequestFocus,
  language,
  hooks
}) => {
  const [currentAlignment, setCurrentAlignment] = useState(undefined)

  useEffect(() => {
    setCurrentAlignment(getSelectionBlockData(editorState, 'textAlign'))
  }, [editorState])

  const setAlignment = (event) => {
    let { alignment } = event.currentTarget.dataset
    const hookReturns = hooks('toggle-text-alignment', alignment)(alignment)

    if (textAligns.includes(hookReturns)) {
      alignment = hookReturns
    }

    onChange(toggleSelectionAlignment(editorState, alignment))
    onRequestFocus()
  }

  const textAlignmentTitles = [
    language.controls.alignLeft,
    language.controls.alignCenter,
    language.controls.alignRight,
    language.controls.alignJustify
  ]

  return (
    <ControlGroup>
      {textAligns.map((item, index) => (
        <Button
          type="button"
          key={uuidv4()}
          data-title={textAlignmentTitles[index]}
          data-alignment={item}
          className={cls(mergeClassNames(item === currentAlignment && 'active'))}
          onClick={setAlignment}
        >
          {iconMap[item] ?? null}
        </Button>
      ))}
    </ControlGroup>
  )
}

export default TextAlign
