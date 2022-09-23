
import { classNameParser } from '../../utils/style'
import React, { FC } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { HeadingsPickerProps } from '../../types'
import Menu from '../Menu'
import MenuItem from '../MenuItem'
import styles from './style.module.scss'
import { defaultHeadings } from '../../constants'
import loadable from '@loadable/component'
import useLanguage from '../../hooks/use-language'
const DropDown = loadable(async () => await import('../DropDown'))

const cls = classNameParser(styles)

const getHeadings = (lang) => [
  {
    key: 'header-one',
    title: `${lang.controls.header} 1`,
    text: <h1>{lang.controls.header} 1</h1>,
    type: 'block-type',
    command: 'header-one'
  },
  {
    key: 'header-two',
    title: `${lang.controls.header} 2`,
    text: <h2>{lang.controls.header} 2</h2>,
    type: 'block-type',
    command: 'header-two'
  },
  {
    key: 'header-three',
    title: `${lang.controls.header} 3`,
    text: <h3>{lang.controls.header} 3</h3>,
    type: 'block-type',
    command: 'header-three'
  },
  {
    key: 'header-four',
    title: `${lang.controls.header} 4`,
    text: <h4>{lang.controls.header} 4</h4>,
    type: 'block-type',
    command: 'header-four'
  },
  {
    key: 'header-five',
    title: `${lang.controls.header} 5`,
    text: <h5>{lang.controls.header} 5</h5>,
    type: 'block-type',
    command: 'header-five'
  },
  {
    key: 'header-six',
    title: `${lang.controls.header} 6`,
    text: <h6>{lang.controls.header} 6</h6>,
    type: 'block-type',
    command: 'header-six'
  },
  {
    key: 'unstyled',
    title: lang.controls.normal,
    text: lang.controls.normal,
    type: 'block-type',
    command: 'unstyled'
  }
]

const HeadingsPicker: FC<HeadingsPickerProps> = ({
  headings = defaultHeadings,
  current,
  getContainerNode,
  disabled,
  onChange
}) => {
  const dropDownInstance = React.createRef<any>()

  const language = useLanguage()

  const innerHeadings = getHeadings(language).filter((item) =>
    headings.includes(item.key)
  )
  const currentHeadingIndex = innerHeadings.findIndex(
    (item) => item.command === current
  )
  const caption = innerHeadings[currentHeadingIndex]
    ? innerHeadings[currentHeadingIndex].title
    : language.controls.normal

  return (
    <DropDown
      caption={caption}
      autoHide
      disabled={disabled}
      getContainerNode={getContainerNode}
      title={language.controls.headings}
      arrowActive={currentHeadingIndex === 0}
      ref={dropDownInstance}
      className={cls('headings-dropdown')}
    >
      <Menu className={cls('headings-menu')}>
        {innerHeadings.map((item) => {
          const isActive = current === item.command
          return (
            <MenuItem
              key={uuidv4()}
              role="presentation"
              className={cls(`headings-menu-item${isActive ? ' active' : ''}`)}
              onClick={() => {
                onChange(item.command, item.type)
                dropDownInstance.current?.hide()
              }}
            >
              {item.text}
            </MenuItem>
          )
        })}
      </Menu>
    </DropDown>
  )
}

export default HeadingsPicker
