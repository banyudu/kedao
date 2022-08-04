import React, { useState, useEffect, useRef, FC } from 'react'
import {
  insertText,
  toggleSelectionLink,
  getSelectionEntityData,
  getSelectionBlockType,
  getSelectionText
} from '../../../utils'
import Switch from '../../common/Switch'
import DropDown from '../../common/DropDown'
import Button from '../../common/Button'
import ControlGroup from '../ControlGroup'
import { MdClose, MdLink, MdLinkOff } from 'react-icons/md'
import './style.scss'
import { defaultIconProps } from '../../../configs/props'
import { CommonPickerProps } from '../../../types'
import { useAtom } from 'jotai'
import { linkEditorActiveAtom } from './states'
import { useResetState } from '../../../utils/use-reset-state'

export interface LinkEditorProps extends CommonPickerProps {
  defaultLinkTarget: string
  allowInsertLinkText: boolean
}

const LinkEditor: FC<LinkEditorProps> = ({
  defaultLinkTarget,
  editorState,
  hooks,
  language,
  getContainerNode,
  allowInsertLinkText,
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
    const hookReturns = hooks('toggle-link', { href, target })({
      href,
      target
    })

    setDropdownActive(false)
    onRequestFocus()

    if (hookReturns === false) {
      return false
    }

    let _href = href
    let _target = target
    if (hookReturns) {
      if (typeof hookReturns.href === 'string') {
        _href = hookReturns.href
      }
      if (typeof hookReturns.target === 'string') {
        _target = hookReturns.target
      }
    }

    if (textSelected) {
      if (_href) {
        onChange(toggleSelectionLink(editorState, _href, _target))
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

  const caption = <MdLink {...defaultIconProps} />

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
        className="link-editor-dropdown"
      >
        <div className="kedao-link-editor">
          {allowInsertLinkText
            ? (
            <div className="input-group">
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
          <div className="input-group">
            <input
              type="text"
              value={href}
              spellCheck={false}
              placeholder={language.linkEditor.linkInputPlaceHolder}
              onKeyDown={handeKeyDown}
              onChange={handleInputLink}
            />
          </div>
          <div className="switch-group">
            <Switch active={target === '_blank'} onClick={toggleTarget} />
            <label>{language.linkEditor.openInNewWindow}</label>
          </div>
          <div className="buttons">
            <a
              onClick={handleUnlink}
              role="presentation"
              className="primary button-remove-link pull-left"
            >
              <MdClose {...defaultIconProps} />
              <span>{language.linkEditor.removeLink}</span>
            </a>
            <button
              type="button"
              onClick={handleConfirm}
              className="primary pull-right"
            >
              {language.base.confirm}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="default pull-right"
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
        disabled={!textSelected || !href}
      >
        <MdLinkOff {...defaultIconProps} />
      </Button>
    </ControlGroup>
  )
}

export default LinkEditor
