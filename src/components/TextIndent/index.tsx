
import { classNameParser } from '../../utils/style'
import React, { useState, useEffect, FC } from 'react'
import { CommonPickerProps } from '../../types'
import {
  decreaseSelectionIndent,
  increaseSelectionIndent,
  getSelectionBlockData
} from '../../utils'
import ControlGroup from '../ControlGroup'
import styles from '../ControlBar/style.module.scss'
import Button from '../Button'
import Icon from '../Icon'
import useLanguage from '../../hooks/use-language'
const cls = classNameParser(styles)

const TextIndent: FC<CommonPickerProps> = ({
  editorState,
  onChange,
  disabled,
  onRequestFocus
}) => {
  const [currentIndent, setCurrentIndent] = useState(0)

  useEffect(() => {
    setCurrentIndent(getSelectionBlockData(editorState, 'textIndent') || 0)
  }, [editorState])

  const increaseIndent = () => {
    onChange(increaseSelectionIndent(editorState))
    onRequestFocus()
  }

  const decreaseIndent = () => {
    onChange(decreaseSelectionIndent(editorState))
    onRequestFocus()
  }

  const language = useLanguage()

  return (
    <ControlGroup>
      <Button
        key={0}
        type="button"
        data-title={language.controls.increaseIndent}
        disabled={disabled || currentIndent >= 6}
        className={cls(`button-indent-increase${
                    currentIndent > 0 && currentIndent < 6 ? ' active' : ''
                  }`)}
        onClick={increaseIndent}
      >
        <Icon type='format-indent-increase' />
      </Button>
      <Button
        key={1}
        type="button"
        data-title={language.controls.decreaseIndent}
        disabled={disabled || currentIndent <= 0}
        className={cls('button-indent-decrease')}
        onClick={decreaseIndent}
      >
        <Icon type='format-indent-decrease' />
      </Button>
    </ControlGroup>
  )
}

export default TextIndent
