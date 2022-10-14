
import { classNameParser } from '../../utils/style'
import React, { useState, useEffect, FC } from 'react'
import { getSelectionBlockData, toggleSelectionAlignment } from '../../utils'
import mergeClassNames from 'merge-class-names'
import ControlGroup from '../ControlGroup'
import { TextAlignProps } from '../../types'
import styles from '../ControlBar/style.module.scss'
import Button from '../Button'
import useLanguage from '../../hooks/use-language'
import AlignCenterIcon from 'tabler-icons-react/dist/icons/align-center'
import AlignLeftIcon from 'tabler-icons-react/dist/icons/align-left'
import AlignRightIcon from 'tabler-icons-react/dist/icons/align-right'
import AlignJustifiedIcon from 'tabler-icons-react/dist/icons/align-justified'
import { tablerIconProps } from '../../constants'

const cls = classNameParser(styles)

const iconMap = {
  left: <AlignLeftIcon {...tablerIconProps} />,
  center: <AlignCenterIcon {...tablerIconProps} />,
  right: <AlignRightIcon {...tablerIconProps} />,
  justify: <AlignJustifiedIcon {...tablerIconProps} />
}

const defaultTextAligns = ['left', 'center', 'right', 'justify']

const TextAlign: FC<TextAlignProps> = ({
  editorState,
  textAligns = defaultTextAligns,
  onChange,
  disabled,
  onRequestFocus
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

  const language = useLanguage()

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
          key={item}
          disabled={disabled}
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
