
import { classNameParser } from '../../utils/style'
import React, { useState, useEffect, FC } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { getSelectionBlockData, toggleSelectionAlignment } from '../../utils'
import mergeClassNames from 'merge-class-names'
import ControlGroup from '../ControlGroup'
import { TextAlignProps } from '../../types'
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

const defaultTextAligns = ['left', 'center', 'right', 'justify']

const TextAlign: FC<TextAlignProps> = ({
  editorState,
  textAligns = defaultTextAligns,
  onChange,
  onRequestFocus,
  language
}) => {
  const [currentAlignment, setCurrentAlignment] = useState(undefined)

  useEffect(() => {
    setCurrentAlignment(getSelectionBlockData(editorState, 'textAlign'))
  }, [editorState])

  const setAlignment = (event) => {
    const { alignment } = event.currentTarget.dataset

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
