import React from 'react'
import { v4 as uuidv4 } from 'uuid'
import { ContentUtils } from '../../../utils'

import getEditorControls from '../../../configs/controls'
import LinkEditor from '../LinkEditor'
import HeadingPicker from '../Headings'
import TextColorPicker from '../TextColor'
import FontSizePicker from '../FontSize'
import LineHeightPicker from '../LineHeight'
import FontFamilyPicker from '../FontFamily'
import TextAlign from '../TextAlign'
import EmojiPicker from '../EmojiPicker'
import LetterSpacingPicker from '../LetterSpacing'
import TextIndent from '../TextIndent'
import DropDown from '../../../components/common/DropDown'
import { showModal } from '../../../components/common/Modal'
import { getExtensionControls } from '../../../helpers/extension'

import './style.scss'

const commandHookMap = {
  'inline-style': 'toggle-inline-style',
  'block-type': 'change-block-type',
  'editor-method': 'exec-editor-command'
}

const exclusiveInlineStyles = {
  superscript: 'subscript',
  subscript: 'superscript'
}

const mergeControls = (
  commonProps,
  builtControls,
  extensionControls,
  extendControls
) => {
  const customExtendControls = extendControls.map((item) =>
    typeof item === 'function' ? item(commonProps) : item
  )

  if (extensionControls.length === 0 && customExtendControls.length === 0) {
    return builtControls
  }

  return builtControls
    .map((item) => {
      return (
        customExtendControls.find((subItem) => {
          return subItem.replace === (item.key || item)
        }) ||
        extensionControls.find((subItem) => {
          return subItem.replace === (item.key || item)
        }) ||
        item
      )
    })
    .concat(extensionControls.length ? 'separator' : '')
    .concat(
      extensionControls.filter((item) => {
        return !item.replace
      })
    )
    .concat(
      customExtendControls.filter((item) => {
        return typeof item === 'string' || !item.replace
      })
    )
}

export default class ControlBar extends React.Component<any, any> {
  componentDidUpdate () {
    const { language } = this.props

    this.allControls.forEach((item) => {
      if (item.type === 'modal') {
        if (item.modal?.id && this.extendedModals[item.modal.id]) {
          this.extendedModals[item.modal.id].update({
            ...item.modal,
            language
          })
        }
      }
    })
  }

  allControls = [];

  mediaLibiraryModal = null;

  extendedModals = {};

  getControlItemClassName (data) {
    let className = 'control-item button'
    const { type, command } = data

    if (
      type === 'inline-style' &&
      ContentUtils.selectionHasInlineStyle(this.props.editorState, command)
    ) {
      className += ' active'
    } else if (
      type === 'block-type' &&
      ContentUtils.getSelectionBlockType(this.props.editorState) === command
    ) {
      className += ' active'
    } else if (
      type === 'entity' &&
      ContentUtils.getSelectionEntityType(this.props.editorState) === command
    ) {
      className += ' active'
    }

    return className
  }

  applyControl (command, type, data: any = {}) {
    let hookCommand = command
    const hookReturns = this.props.hooks(
      commandHookMap[type] || type,
      hookCommand
    )(hookCommand)
    let editorState = this.props.editorState

    if (hookReturns === false) {
      return false
    }

    if (typeof hookReturns === 'string') {
      hookCommand = hookReturns
    }

    if (type === 'inline-style') {
      const exclusiveInlineStyle = exclusiveInlineStyles[hookCommand]
      if (
        exclusiveInlineStyle &&
        ContentUtils.selectionHasInlineStyle(editorState, exclusiveInlineStyle)
      ) {
        editorState = ContentUtils.toggleSelectionInlineStyle(
          editorState,
          exclusiveInlineStyle
        )
      }
      this.props.editor.setValue(
        ContentUtils.toggleSelectionInlineStyle(editorState, hookCommand)
      )
    }
    if (type === 'block-type') {
      this.props.editor.setValue(
        ContentUtils.toggleSelectionBlockType(editorState, hookCommand)
      )
    }
    if (type === 'entity') {
      this.props.editor.setValue(
        ContentUtils.toggleSelectionEntity(editorState, {
          type: hookCommand,
          mutability: data.mutability || 'MUTABLE',
          data: data.data || {}
        })
      )
    }
    if (type === 'editor-method' && this.props.editor[hookCommand]) {
      this.props.editor[hookCommand]()
    }
    return this.props.editor
  }

  openFinder = () => {
    if (!this.props.finder || !this.props.finder.ReactComponent) {
      return false
    }

    if (this.props.hooks('open-kedao-finder')() === false) {
      return false
    }

    const mediaProps = this.props.media
    const MediaLibrary = this.props.finder.ReactComponent

    this.mediaLibiraryModal = showModal({
      title: this.props.language.controls.mediaLibirary,
      language: this.props.language,
      width: 640,
      showFooter: false,
      onClose: mediaProps.onClose,
      component: (
        <MediaLibrary
          accepts={mediaProps.accepts}
          onCancel={this.closeFinder}
          onInsert={this.insertMedias}
          onChange={mediaProps.onChange}
          externals={mediaProps.externals}
          onBeforeSelect={this.bindFinderHook('select-medias')}
          onBeforeDeselect={this.bindFinderHook('deselect-medias')}
          onBeforeRemove={this.bindFinderHook('remove-medias')}
          onBeforeInsert={this.bindFinderHook('insert-medias')}
          onFileSelect={this.bindFinderHook('select-files')}
        />
      )
    })
    return true
  };

  bindFinderHook =
    (hookName) =>
      (...params) => {
        return this.props.hooks(hookName, params[0])(...params)
      };

  insertMedias = (medias) => {
    this.props.editor.setValue(
      ContentUtils.insertMedias(this.props.editorState, medias)
    )
    this.props.editor.requestFocus()
    if (this.props.media.onInsert) {
      this.props.media.onInsert(medias)
    }
    this.closeFinder()
  };

  closeFinder = () => {
    if (this.props.media.onCancel) {
      this.props.media.onCancel()
    }
    if (this.mediaLibiraryModal) {
      this.mediaLibiraryModal.close()
    }
  };

  preventDefault (event) {
    const tagName = event.target.tagName.toLowerCase()

    if (tagName === 'input' || tagName === 'label') {
      // ...
    } else {
      event.preventDefault()
    }
  }

  render () {
    const {
      allowInsertLinkText,
      className,
      colorPicker,
      colorPickerAutoHide,
      colorPickerTheme,
      colors,
      controls,
      defaultLinkTarget,
      editor,
      editorId,
      editorState,
      emojis,
      extendControls,
      fontFamilies,
      fontSizes,
      getContainerNode,
      headings,
      hooks,
      language,
      letterSpacings,
      lineHeights,
      media,
      style,
      textAligns,
      textBackgroundColor
    } = this.props
    const currentBlockType = ContentUtils.getSelectionBlockType(editorState)
    const commonProps = {
      editor,
      editorId,
      editorState,
      language,
      getContainerNode,
      hooks
    }

    const renderedControls = []
    const editorControls = getEditorControls(language, editor)
    const extensionControls = getExtensionControls(editorId)
    const allControls = mergeControls(
      commonProps,
      controls,
      extensionControls,
      extendControls
    )

    this.allControls = allControls

    return (
      <div
        className={`bf-controlbar ${className || ''}`}
        style={style}
        onMouseDown={this.preventDefault}
        role="button"
        tabIndex={0}
      >
        {allControls.map((item) => {
          const itemKey = typeof item === 'string' ? item : item.key
          if (typeof itemKey !== 'string') {
            return null
          }
          if (renderedControls.includes(itemKey)) {
            return null
          }
          if (itemKey.toLowerCase() === 'separator') {
            return <span key={uuidv4()} className="separator-line" />
          }
          let controlItem: any = editorControls.find((subItem) => {
            return subItem.key.toLowerCase() === itemKey.toLowerCase()
          })
          if (typeof item !== 'string') {
            controlItem = { ...controlItem, ...item }
          }
          if (!controlItem) {
            return null
          }
          renderedControls.push(itemKey)
          if (controlItem.type === 'headings') {
            return (
              <HeadingPicker
                key={uuidv4()}
                headings={headings}
                current={currentBlockType}
                onChange={(command) => this.applyControl(command, 'block-type')}
                {...commonProps}
              />
            )
          }
          if (controlItem.type === 'text-color') {
            return (
              <TextColorPicker
                key={uuidv4()}
                colors={colors}
                colorPicker={colorPicker}
                theme={colorPickerTheme}
                autoHide={colorPickerAutoHide}
                enableBackgroundColor={textBackgroundColor}
                {...commonProps}
              />
            )
          }
          if (controlItem.type === 'font-size') {
            return (
              <FontSizePicker
                key={uuidv4()}
                fontSizes={fontSizes}
                defaultCaption={controlItem.title}
                {...commonProps}
              />
            )
          }
          if (controlItem.type === 'line-height') {
            return (
              <LineHeightPicker
                key={uuidv4()}
                lineHeights={lineHeights}
                defaultCaption={controlItem.title}
                {...commonProps}
              />
            )
          }
          if (controlItem.type === 'letter-spacing') {
            return (
              <LetterSpacingPicker
                key={uuidv4()}
                letterSpacings={letterSpacings}
                defaultCaption={controlItem.title}
                {...commonProps}
              />
            )
          }
          if (controlItem.type === 'text-indent') {
            return (
              <TextIndent
                key={uuidv4()}
                defaultCaption={controlItem.title}
                {...commonProps}
              />
            )
          }
          if (controlItem.type === 'font-family') {
            return (
              <FontFamilyPicker
                key={uuidv4()}
                fontFamilies={fontFamilies}
                defaultCaption={controlItem.title}
                {...commonProps}
              />
            )
          }
          if (controlItem.type === 'emoji') {
            return (
              <EmojiPicker
                key={uuidv4()}
                emojis={emojis}
                defaultCaption={controlItem.text}
                {...commonProps}
              />
            )
          }
          if (controlItem.type === 'link') {
            return (
              <LinkEditor
                key={uuidv4()}
                defaultLinkTarget={defaultLinkTarget}
                allowInsertLinkText={allowInsertLinkText}
                {...commonProps}
              />
            )
          }
          if (controlItem.type === 'text-align') {
            return (
              <TextAlign
                key={uuidv4()}
                textAligns={textAligns}
                {...commonProps}
              />
            )
          }
          if (controlItem.type === 'media') {
            if (!media.image && !media.video && !media.audio) {
              return null
            }
            return (
              <button
                type="button"
                key={uuidv4()}
                data-title={controlItem.title}
                disabled={controlItem.disabled}
                className="control-item media button"
                onClick={this.openFinder}
              >
                {controlItem.text}
              </button>
            )
          }
          if (controlItem.type === 'dropdown') {
            return (
              <DropDown
                key={uuidv4()}
                className={`control-item extend-control-item dropdown ${
                  controlItem.className || ''
                }`}
                caption={controlItem.text}
                htmlCaption={controlItem.html}
                showArrow={controlItem.showArrow}
                title={controlItem.title}
                arrowActive={controlItem.arrowActive}
                theme={controlItem.theme}
                autoHide={controlItem.autoHide}
                disabled={controlItem.disabled}
                ref={controlItem.ref}
                {...commonProps}
              >
                {controlItem.component}
              </DropDown>
            )
          }
          if (controlItem.type === 'modal') {
            return (
              <button
                type="button"
                key={uuidv4()}
                data-title={controlItem.title}
                disabled={controlItem.disabled}
                className={`control-item extend-control-item button ${
                  controlItem.className || ''
                }`}
                dangerouslySetInnerHTML={
                  controlItem.html ? { __html: controlItem.html } : null
                }
                onClick={(event) => {
                  if (controlItem.modal?.id) {
                    if (this.extendedModals[controlItem.modal.id]) {
                      this.extendedModals[controlItem.modal.id].active = true
                      this.extendedModals[controlItem.modal.id].update({
                        ...controlItem.modal,
                        language
                      })
                    } else {
                      this.extendedModals[controlItem.modal.id] = showModal({
                        ...controlItem.modal,
                        language
                      })
                      if (controlItem.modal.onCreate) {
                        controlItem.modal.onCreate(
                          this.extendedModals[controlItem.modal.id]
                        )
                      }
                    }
                  }
                  if (controlItem.onClick) {
                    controlItem.onClick(event)
                  }
                }}
              >
                {!controlItem.html ? controlItem.text : null}
              </button>
            )
          }
          if (controlItem.type === 'component') {
            return (
              <div
                key={uuidv4()}
                className={`component-wrapper ${controlItem.className || ''}`}
              >
                {controlItem.component}
              </div>
            )
          }
          if (controlItem.type === 'button') {
            return (
              <button
                type="button"
                key={uuidv4()}
                data-title={controlItem.title}
                disabled={controlItem.disabled}
                className={`control-item button ${controlItem.className || ''}`}
                dangerouslySetInnerHTML={
                  controlItem.html ? { __html: controlItem.html } : null
                }
                onClick={(event) =>
                  controlItem.onClick?.(event)
                }
              >
                {!controlItem.html ? controlItem.text : null}
              </button>
            )
          }
          if (controlItem) {
            let disabled = false

            if (controlItem.command === 'undo') {
              disabled = editorState.getUndoStack().size === 0
            } else if (controlItem.command === 'redo') {
              disabled = editorState.getRedoStack().size === 0
            }

            return (
              <button
                type="button"
                key={uuidv4()}
                disabled={disabled}
                data-title={controlItem.title}
                className={this.getControlItemClassName({
                  type: controlItem.type,
                  command: controlItem.command
                })}
                onClick={() =>
                  this.applyControl(
                    controlItem.command,
                    controlItem.type,
                    controlItem.data
                  )
                }
              >
                {controlItem.text}
              </button>
            )
          }
          return null
        })}
      </div>
    )
  }
}
