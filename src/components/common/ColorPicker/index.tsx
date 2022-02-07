import React, { FC } from 'react'
import { v4 as uuidv4 } from 'uuid'
import './style.scss'

export interface ColorPickerProps {
  presetColors: string[]
  color: string
  onChange: (color: string, closePicker: boolean) => void
}

const ColorPicker: FC<ColorPickerProps> = ({ presetColors, color, onChange }) => (
  <div className="bf-colors-wrap">
    <ul className="bf-colors">
      {presetColors.map((item) => {
        const className =
          color && item.toLowerCase() === color.toLowerCase()
            ? 'color-item active'
            : 'color-item'
        return (
          <li
            role="presentation"
            key={uuidv4()}
            title={item}
            className={className}
            style={{ color: item }}
            data-color={item.replace('#', '')}
            onClick={(e) => {
              onChange(e.currentTarget.dataset.color, true)
            }}
          />
        )
      })}
    </ul>
  </div>
)

export default ColorPicker
