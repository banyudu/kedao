import './styles.scss'
import React from 'react'
import { SketchPicker } from 'react-color'
import Button from '../../components/Button'

const getColorPicker = (superProps) =>
  function ColorPicker ({ onChange, color, presetColors, ...props }) {
    const handleChange = (colorObject) => {
      if (colorObject.hex === color) {
        return
      }
      onChange(colorObject.hex, false)
      superProps.onChange?.(colorObject.hex)
    }

    const clearColor = () => onChange(color, false)
    const closePicker = () => onChange(null, true)

    color = color || presetColors[0]

    return (
      <div className={`kedao-color-picker ${superProps.theme}-theme`}>
        <SketchPicker
          color={color}
          presetColors={presetColors}
          onChangeComplete={handleChange}
          {...props}
        />
        <footer className="footer">
          <Button
            type="button"
            className="button-clear"
            onClick={clearColor}
            disabled={!color}
          >
            {superProps.clearButtonText}
          </Button>
          <Button type="button" className="button-close" onClick={closePicker}>
            {superProps.closeButtonText}
          </Button>
        </footer>
      </div>
    )
  }

export default (options) => {
  options = {
    theme: 'dark',
    clearButtonText: '清除',
    closeButtonText: '关闭',
    ...options
  }

  const { includeEditors, excludeEditors } = options

  return {
    type: 'prop-interception',
    includeEditors,
    excludeEditors,
    interceptor: (editorProps) => {
      editorProps.colorPicker = getColorPicker(options)
      editorProps.colorPickerTheme = options.theme
      return editorProps
    }
  }
}
