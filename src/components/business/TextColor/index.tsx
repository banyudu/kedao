import React, {
  CSSProperties,
  useRef,
  useState,
  FC,
  MouseEventHandler
} from 'react'
import {
  toggleSelectionBackgroundColor,
  toggleSelectionColor
} from '../../../utils'
import DropDown, { DropDownProps } from '../../common/DropDown'
import BuiltinColorPicker from '../../common/ColorPicker'
import './style.scss'
import { MdFormatColorText } from 'react-icons/md'
import { defaultIconProps } from '../../../configs/props'
import { Hooks, EditorState, Language } from '../../../types'

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

  const captionStyle: CSSProperties = {}
  let currentColor = null

  const selectionStyles = editorState
    .getCurrentInlineStyle()
    .toJS() as string[]

  selectionStyles.forEach((style) => {
    if (style.indexOf('COLOR-') === 0) {
      captionStyle.color = `#${style.split('-')[1]}`
      if (colorType === 'color') {
        currentColor = captionStyle.color
      }
    }

    if (style.indexOf('BGCOLOR-') === 0) {
      captionStyle.backgroundColor = `#${style.split('-')[1]}`
      if (colorType === 'background-color') {
        currentColor = captionStyle.backgroundColor
      }
    }
  })

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
      className="control-item dropdown text-color-dropdown"
    >
      <div className="bf-text-color-picker-wrap">
        <div
          className="bf-color-switch-buttons"
          style={enableBackgroundColor ? {} : { display: 'none' }}
        >
          <button
            type="button"
            data-type="color"
            className={colorType === 'color' ? 'active' : ''}
            onClick={switchColorType}
          >
            {language.controls.textColor}
          </button>
          <button
            type="button"
            data-type="background-color"
            className={colorType === 'background-color' ? 'active' : ''}
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
