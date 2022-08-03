import React, { useState, useEffect, FC } from 'react'
import { MdFormatIndentDecrease, MdFormatIndentIncrease } from 'react-icons/md'
import { defaultIconProps } from '../../../configs/props'
import { CommonPickerProps } from '../../../types'
import {
  decreaseSelectionIndent,
  increaseSelectionIndent,
  getSelectionBlockData
} from '../../../utils'
import ControlGroup from '..//ControlGroup'
import '../ControlBar/style.scss'
import Button from '../../common/Button'

const TextIndent: FC<CommonPickerProps> = ({
  editorState,
  language,
  onChange,
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

  return (
    <ControlGroup>
      <Button
        key={0}
        type="button"
        data-title={language.controls.increaseIndent}
        disabled={currentIndent >= 6}
        className={`button-indent-increase${
          currentIndent > 0 && currentIndent < 6 ? ' active' : ''
        }`}
        onClick={increaseIndent}
      >
        <MdFormatIndentIncrease {...defaultIconProps} />
      </Button>
      <Button
        key={1}
        type="button"
        data-title={language.controls.decreaseIndent}
        disabled={currentIndent <= 0}
        className="button-indent-decrease"
        onClick={decreaseIndent}
      >
        <MdFormatIndentDecrease {...defaultIconProps} />
      </Button>
    </ControlGroup>
  )
}

export default TextIndent
