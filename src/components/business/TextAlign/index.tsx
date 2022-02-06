import React, { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { ContentUtils } from '../../../utils'
import mergeClassNames from 'merge-class-names'
import ControlGroup from '../ControlGroup'
import {
  MdFormatAlignCenter,
  MdFormatAlignJustify,
  MdFormatAlignLeft,
  MdFormatAlignRight
} from 'react-icons/md'
import { defaultIconProps } from '../../../configs/props'

const iconMap = {
  left: <MdFormatAlignLeft {...defaultIconProps} />,
  center: <MdFormatAlignCenter {...defaultIconProps} />,
  right: <MdFormatAlignRight {...defaultIconProps} />,
  justify: <MdFormatAlignJustify {...defaultIconProps} />
}

const TextAlign = ({ editorState, textAligns, editor, language, hooks }) => {
  const [currentAlignment, setCurrentAlignment] = useState(undefined)

  useEffect(() => {
    setCurrentAlignment(
      ContentUtils.getSelectionBlockData(editorState, 'textAlign')
    )
  }, [editorState])

  const setAlignment = event => {
    let { alignment } = event.currentTarget.dataset
    const hookReturns = hooks('toggle-text-alignment', alignment)(alignment)

    if (textAligns.indexOf(hookReturns) > -1) {
      alignment = hookReturns
    }

    editor.setValue(
      ContentUtils.toggleSelectionAlignment(editorState, alignment)
    )
    editor.requestFocus()
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
        <button
          type='button'
          key={uuidv4()}
          data-title={textAlignmentTitles[index]}
          data-alignment={item}
          className={mergeClassNames(
            'control-item button',
            item === currentAlignment && 'active'
          )}
          onClick={setAlignment}
        >
          {iconMap[item] ?? null}
        </button>
      ))}
    </ControlGroup>
  )
}

export default TextAlign