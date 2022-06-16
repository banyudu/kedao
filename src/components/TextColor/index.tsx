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
import DropDown, { DropDownProps } from '../DropDown'
import BuiltinColorPicker from '../ColorPicker'
import styles from './style.module.scss'
import { MdFormatColorText } from 'react-icons/md'
import { defaultIconProps } from '../../configs/props'
import { Hooks, EditorState, Language } from '../../types'
const cls = classNameParser(styles)

export interface TextColorPickerProps
  extends Pick<DropDownProps, 'getContainerNode' | 'autoHide'> {
  hooks: Hooks
  editorState: EditorState
  colorPicker: React.ComponentType<any>
  enableBackgroundColor: boolean
  colors: string[]
  language: Language
  onChange: (state: EditorState) => void
  onRequestFocus: () => void
}

const TextColorPicker: FC<TextColorPickerProps> = ({
  hooks,
  editorState,
  colorPicker,
  getContainerNode,
  enableBackgroundColor,
  colors,
  language,
  autoHide,
  onChange,
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
      let newColor = color
      const hookReturns = hooks(`toggle-text-${colorType}`, newColor)(newColor)

      if (hookReturns === false) {
        return false
      }

      if (typeof hookReturns === 'string') {
        newColor = hookReturns
      }

      if (colorType === 'color') {
        onChange(toggleSelectionColor(editorState, newColor))
      } else {
        onChange(toggleSelectionBackgroundColor(editorState, newColor))
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
    <MdFormatColorText {...defaultIconProps} style={captionStyle} />
  )

  const ColorPicker = colorPicker || BuiltinColorPicker

  return (
    <DropDown
      caption={caption}
      title={language.controls.color}
      showArrow={false}
      autoHide={autoHide}
      // theme={theme}
      getContainerNode={getContainerNode}
      ref={dropDownInstance}
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
          width={200}
          color={currentColor}
          disableAlpha
          presetColors={colors}
          onChange={toggleColor}
        />
      </div>
    </DropDown>
  )
}

export default TextColorPicker
