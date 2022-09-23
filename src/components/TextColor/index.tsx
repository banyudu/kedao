import { classNameParser } from '../../utils/style'
import React, {
  CSSProperties,
  useRef,
  useState,
  FC,
  MouseEventHandler,
  useEffect
} from 'react'
import {
  toggleSelectionBackgroundColor,
  toggleSelectionColor
} from '../../utils'
import ColorPicker from '../ColorPicker'
import styles from './style.module.scss'
import Icon from '../Icon'
import { TextColorPickerProps } from '../../types'
import loadable from '@loadable/component'
import useLanguage from '../../hooks/use-language'
const DropDown = loadable(async () => await import('../DropDown'))

const cls = classNameParser(styles)

const TextColorPicker: FC<TextColorPickerProps> = ({
  editorState,
  getContainerNode,
  enableBackgroundColor,
  colors,
  onChange,
  disabled,
  onRequestFocus
}) => {
  const [colorType, setColorType] = useState('color')
  const dropDownInstance = useRef(null)

  const [captionStyle, setCaptionStyle] = useState<CSSProperties>({})
  const [currentColor, setCurrentColor] = useState<string | null>(null)

  const switchColorType: MouseEventHandler<HTMLButtonElement> = ({
    currentTarget
  }) => {
    setColorType(currentTarget.dataset.type)
  }

  const toggleColor = (color: string, closePicker: boolean) => {
    if (color) {
      if (colorType === 'color') {
        onChange(toggleSelectionColor(editorState, color))
      } else {
        onChange(toggleSelectionBackgroundColor(editorState, color))
      }
    }

    if (closePicker) {
      dropDownInstance.current?.hide()
      onRequestFocus()
    }
    return true
  }

  useEffect(() => {
    const selectionStyles = editorState
      .getCurrentInlineStyle()
      .toJS() as string[]
    const newCaptionStyle: CSSProperties = {}
    let newCurrentColor: string | null = null

    selectionStyles.forEach(style => {
      if (style.indexOf('COLOR-') === 0) {
        newCaptionStyle.color = `#${style.split('-')[1]}`
        if (colorType === 'color') {
          newCurrentColor = newCaptionStyle.color
        }
      }

      if (style.indexOf('BGCOLOR-') === 0) {
        newCaptionStyle.backgroundColor = `#${style.split('-')[1]}`
        if (colorType === 'background-color') {
          newCurrentColor = newCaptionStyle.backgroundColor
        }
      }
    })

    setCaptionStyle(newCaptionStyle)
    setCurrentColor(newCurrentColor)
  }, [editorState])

  const caption = (
    <Icon type='format-color-text' style={captionStyle} />
  )

  const language = useLanguage()

  return (
    <DropDown
      caption={caption}
      title={language.controls.color}
      showArrow={false}
      autoHide
      getContainerNode={getContainerNode}
      ref={dropDownInstance}
      disabled={disabled}
      className={cls('text-color-dropdown')}
    >
      <div className={cls('kedao-text-color-picker-wrap')}>
        <div
          className={cls('kedao-color-switch-buttons')}
          style={enableBackgroundColor ? {} : { display: 'none' }}
        >
          <button
            type='button'
            data-type='color'
            className={cls(colorType === 'color' ? 'active' : '')}
            onClick={switchColorType}
          >
            {language.controls.textColor}
          </button>
          <button
            type='button'
            data-type='background-color'
            className={cls(colorType === 'background-color' ? 'active' : '')}
            onClick={switchColorType}
          >
            {language.controls.backgroundColor}
          </button>
        </div>
        <ColorPicker
          color={currentColor}
          presetColors={colors}
          onChange={toggleColor}
        />
      </div>
    </DropDown>
  )
}

export default TextColorPicker
