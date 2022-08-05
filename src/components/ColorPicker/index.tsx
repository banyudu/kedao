
import { classNameParser } from '../../utils/style'
import React, { FC } from 'react'
import { v4 as uuidv4 } from 'uuid'
import styles from './style.module.scss'
const cls = classNameParser(styles)

export interface ColorPickerProps {
  presetColors: string[]
  color: string
  onChange: (color: string, closePicker: boolean) => void
}

const ColorPicker: FC<ColorPickerProps> = ({
  presetColors,
  color,
  onChange
}) => (
  <div className={cls('kedao-colors-wrap')}>
    <ul className={cls('kedao-colors')}>
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
            className={cls(className)}
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
