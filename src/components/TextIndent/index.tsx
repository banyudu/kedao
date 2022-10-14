
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
import useLanguage from '../../hooks/use-language'
import IndentDecreaseIcon from 'tabler-icons-react/dist/icons/indent-decrease'
import IndentIncreaseIcon from 'tabler-icons-react/dist/icons/indent-increase'
import { tablerIconProps } from '../../constants'
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
        <IndentIncreaseIcon {...tablerIconProps} />
      </Button>
      <Button
        key={1}
        type="button"
        data-title={language.controls.decreaseIndent}
        disabled={disabled || currentIndent <= 0}
        className={cls('button-indent-decrease')}
        onClick={decreaseIndent}
      >
        <IndentDecreaseIcon {...tablerIconProps} />
      </Button>
    </ControlGroup>
  )
}

export default TextIndent
