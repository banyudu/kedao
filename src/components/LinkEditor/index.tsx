
import { classNameParser } from '../../utils/style'
import React, { useState, useEffect, useRef, FC } from 'react'
import {
  insertText,
  toggleSelectionLink,
  getSelectionEntityData,
  getSelectionBlockType,
  getSelectionText
} from '../../utils'
import Switch from '../Switch'
import Button from '../Button'
import ControlGroup from '../ControlGroup'
import styles from './style.module.scss'
import { LinkEditorProps } from '../../types'
import { useAtom } from 'jotai'
import { linkEditorActiveAtom } from '../../states'
import { useResetState } from '../../hooks/use-reset-state'
import loadable from '@loadable/component'
import useLanguage from '../../hooks/use-language'
import LinkIcon from 'tabler-icons-react/dist/icons/link'
import LinkOffIcon from 'tabler-icons-react/dist/icons/link-off'
import XIcon from 'tabler-icons-react/dist/icons/x'
import { tablerIconProps } from '../../constants'

const DropDown = loadable(async () => await import('../DropDown'))

const cls = classNameParser(styles)

const LinkEditor: FC<LinkEditorProps> = ({
  defaultLinkTarget = '',
  editorState,
  getContainerNode,
  allowInsertLinkText,
  disabled,
  onChange,
  onRequestFocus
}) => {
  const [text, setText, resetText] = useResetState('')
  const [href, setHref, resetHref] = useResetState('')
  const [target, setTarget, resetTarget] = useResetState(
    defaultLinkTarget || ''
  )
  const [textSelected, setTextSelected] = useState(false)
  const [isDropdownActive, setDropdownActive] = useAtom(linkEditorActiveAtom)

  useEffect(() => {
    const { href, target } = getSelectionEntityData(editorState, 'LINK')
    const textSelected =
      !editorState.getSelection().isCollapsed() &&
      getSelectionBlockType(editorState) !== 'atomic'

    let selectedText = ''

    if (textSelected) {
      selectedText = getSelectionText(editorState)
    }

    setTextSelected(textSelected)
    setText(selectedText)
    setHref(href || '')
    setTarget(
      typeof target === 'undefined' ? defaultLinkTarget || '' : target || ''
    )
  }, [editorState, defaultLinkTarget])

  const dropDownInstance = useRef(null)

  const handeKeyDown = (e) => {
    if (e.keyCode === 13) {
      handleConfirm()
      e.preventDefault()
      return false
    }
    return true
  }

  const handleTnputText = (e) => {
    setText(e.currentTarget.value)
  }

  const handleInputLink = (e) => {
    setHref(e.currentTarget.value)
  }

  const toggleTarget = () => {
    setTarget((target) => (target === '_blank' ? '' : '_blank'))
  }

  const handleCancel = () => {
    setDropdownActive(false)
  }

  const handleUnlink = () => {
    setDropdownActive(false)
    onChange(toggleSelectionLink(editorState, false))
  }

  const handleConfirm = () => {
    setDropdownActive(false)
    onRequestFocus()

    if (textSelected) {
      if (href) {
        onChange(toggleSelectionLink(editorState, href, target))
      } else {
        onChange(toggleSelectionLink(editorState, false))
      }
    } else {
      onChange(
        insertText(editorState, text || href, null, {
          type: 'LINK',
          data: { href, target }
        })
      )
    }
    return true
  }

  const caption = <LinkIcon {...tablerIconProps} />

  const language = useLanguage()

  return (
    <ControlGroup>
      <DropDown
        key={0}
        caption={caption}
        isActive={isDropdownActive}
        onActiveChage={(v) => {
          setDropdownActive(v)
          if (!v) {
            resetHref()
            resetTarget()
            resetText()
          }
        }}
        title={language.controls.link}
        autoHide
        getContainerNode={getContainerNode}
        showArrow={false}
        ref={dropDownInstance}
        className={cls('link-editor-dropdown')}
        disabled={disabled}
      >
        <div className={cls('kedao-link-editor')}>
          {allowInsertLinkText
            ? (
            <div className={cls('input-group')}>
              <input
                type="text"
                value={text}
                spellCheck={false}
                disabled={textSelected}
                placeholder={language.linkEditor.textInputPlaceHolder}
                onKeyDown={handeKeyDown}
                onChange={handleTnputText}
              />
            </div>
              )
            : null}
          <div className={cls('input-group')}>
            <input
              type="text"
              value={href}
              spellCheck={false}
              placeholder={language.linkEditor.linkInputPlaceHolder}
              onKeyDown={handeKeyDown}
              onChange={handleInputLink}
            />
          </div>
          <Switch
            active={target === '_blank'}
            onClick={toggleTarget}
            label={language.linkEditor.openInNewWindow}
          />
          <div className={cls('buttons')}>
            <a
              onClick={handleUnlink}
              role="presentation"
              className={cls('primary button-remove-link pull-left')}
            >
              <span>{language.linkEditor.removeLink}</span>
              <XIcon {...tablerIconProps} />
            </a>
            <button
              type="button"
              onClick={handleConfirm}
              className={cls('primary pull-right')}
            >
              {language.base.confirm}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className={cls('default pull-right')}
            >
              {language.base.cancel}
            </button>
          </div>
        </div>
      </DropDown>
      <Button
        key={1}
        type="button"
        data-title={language.controls.unlink}
        onClick={handleUnlink}
        disabled={disabled || !textSelected || !href}
      >
        <LinkOffIcon {...tablerIconProps} />
      </Button>
    </ControlGroup>
  )
}

export default LinkEditor
