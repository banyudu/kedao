import React, { useEffect, useRef, FC, CSSProperties } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { ContentUtils } from '../../../utils'
import getEditorControls from '../../../configs/controls'
import LinkEditor, { LinkEditorProps } from '../LinkEditor'
import HeadingPicker, { HeadingsPickerProps } from '../Headings'
import TextColorPicker, { TextColorPickerProps } from '../TextColor'
import FontSizePicker, { FontSizePickerProps } from '../FontSize'
import LineHeightPicker, { LineHeightPickerProps } from '../LineHeight'
import FontFamilyPicker, { FontFamilyPickerProps } from '../FontFamily'
import TextAlign, { TextAlignProps } from '../TextAlign'
import EmojiPicker, { EmojiPickerProps } from '../EmojiPicker'
import LetterSpacingPicker, { LetterSpacingPickerProps } from '../LetterSpacing'
import TextIndent from '../TextIndent'
import DropDown from '../../../components/common/DropDown'
import { showModal } from '../../../components/common/Modal'
import { getExtensionControls } from '../../../helpers/extension'
import type { Finder, MediaProps, ControlItem, CommonPickerProps, ModalControlItem, ButtonControlItem, DropDownControlItem } from '../../../types'
import './style.scss'

const isModalControl = (control: ControlItem): control is ModalControlItem => {
  return control.type === 'modal'
}

const isButtonControl = (control: ControlItem): control is ButtonControlItem => {
  return control.type === 'button'
}

const isDropDownControl = (control: ControlItem): control is DropDownControlItem => {
  return control.type === 'dropdown'
}

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
  const customExtendControls = extendControls.map(item =>
    typeof item === 'function' ? item(commonProps) : item
  )

  if (extensionControls.length === 0 && customExtendControls.length === 0) {
    return builtControls
  }

  return builtControls
    .map(item => {
      return (
        customExtendControls.find(subItem => {
          return subItem.replace === (item.key || item)
        }) ||
        extensionControls.find(subItem => {
          return subItem.replace === (item.key || item)
        }) ||
        item
      )
    })
    .concat(extensionControls.length ? 'separator' : '')
    .concat(
      extensionControls.filter(item => {
        return !item.replace
      })
    )
    .concat(
      customExtendControls.filter(item => {
        return typeof item === 'string' || !item.replace
      })
    )
}

interface ControlBarProps extends
  CommonPickerProps,
  Pick<TextColorPickerProps, 'colorPicker'>,
  Pick<EmojiPickerProps, 'emojis'>,
  Pick<FontFamilyPickerProps, 'fontFamilies'>,
  Pick<FontSizePickerProps, 'fontSizes'>,
  Pick<HeadingsPickerProps, 'headings'>,
  Pick<LetterSpacingPickerProps, 'letterSpacings'>,
  Pick<LineHeightPickerProps, 'lineHeights'>,
  Pick<TextAlignProps, 'textAligns'>,
  Pick<LinkEditorProps, 'defaultLinkTarget'> {
  finder: Finder
  className: string
  style: CSSProperties
  colors: string[]
  allowInsertLinkText: boolean
  media: MediaProps
  colorPickerAutoHide: TextColorPickerProps['autoHide']
  controls: ControlItem[]
  editorId: string
  extendControls: ControlItem[]
  textBackgroundColor: boolean
}

const ControlBar: FC<ControlBarProps> = ({
  language,
  editorState,
  hooks,
  editor,
  finder,
  media,
  allowInsertLinkText,
  className,
  colorPicker,
  colorPickerAutoHide,
  // colorPickerTheme,
  colors,
  controls,
  defaultLinkTarget,
  editorId,
  emojis,
  extendControls,
  fontFamilies,
  fontSizes,
  getContainerNode,
  headings,
  letterSpacings,
  lineHeights,
  style,
  textAligns,
  textBackgroundColor
}) => {
  useEffect(() => {
    allControls.current?.forEach(item => {
      if (item.type === 'modal') {
        if (item.modal?.id && extendedModals.current?.[item.modal.id]) {
          extendedModals[item.modal.id].update({
            ...item.modal,
            language
          })
        }
      }
    })
  }, [])

  const allControls = useRef([])
  const mediaLibiraryModal = useRef(null)
  const extendedModals = useRef({})

  const getControlTypeClassName = data => {
    let className = 'control-item button'
    const { type, command } = data

    if (
      type === 'inline-style' &&
      ContentUtils.selectionHasInlineStyle(editorState, command)
    ) {
      className += ' active'
    } else if (
      type === 'block-type' &&
      ContentUtils.getSelectionBlockType(editorState) === command
    ) {
      className += ' active'
    } else if (
      type === 'entity' &&
      ContentUtils.getSelectionEntityType(editorState) === command
    ) {
      className += ' active'
    }

    return className
  }

  const applyControl = (command, type, data: any = {}) => {
    let hookCommand = command
    const hookReturns = hooks(
      commandHookMap[type] || type,
      hookCommand
    )(hookCommand)

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
      editor.setValue(
        ContentUtils.toggleSelectionInlineStyle(editorState, hookCommand)
      )
    }
    if (type === 'block-type') {
      editor.setValue(
        ContentUtils.toggleSelectionBlockType(editorState, hookCommand)
      )
    }
    if (type === 'entity') {
      editor.setValue(
        ContentUtils.toggleSelectionEntity(editorState, {
          type: hookCommand,
          mutability: data.mutability || 'MUTABLE',
          data: data.data || {}
        })
      )
    }
    if (type === 'editor-method' && editor[hookCommand]) {
      editor[hookCommand]()
    }
    return editor
  }

  const openFinder = () => {
    if (!finder || !finder.ReactComponent) {
      return false
    }

    if (hooks('open-kedao-finder')() === false) {
      return false
    }

    const mediaProps = media
    const MediaLibrary = finder.ReactComponent

    mediaLibiraryModal.current = showModal({
      title: language.controls.mediaLibirary,
      language: language,
      width: 640,
      showFooter: false,
      onClose: mediaProps.onClose,
      component: (
        <MediaLibrary
          accepts={mediaProps.accepts}
          onCancel={closeFinder}
          onInsert={insertMedias}
          onChange={mediaProps.onChange}
          externals={mediaProps.externals}
          onBeforeSelect={bindFinderHook('select-medias')}
          onBeforeDeselect={bindFinderHook('deselect-medias')}
          onBeforeRemove={bindFinderHook('remove-medias')}
          onBeforeInsert={bindFinderHook('insert-medias')}
          onFileSelect={bindFinderHook('select-files')}
        />
      )
    })
    return true
  }

  const bindFinderHook = hookName => (...params) => {
    return hooks(hookName, params[0])(...params)
  }

  const insertMedias = medias => {
    editor.setValue(ContentUtils.insertMedias(editorState, medias))
    editor.requestFocus()
    media.onInsert?.(medias)
    closeFinder()
  }

  const closeFinder = () => {
    media.onCancel?.()
    mediaLibiraryModal.current?.close()
  }

  const preventDefault = event => {
    const tagName = event.target.tagName.toLowerCase()

    if (tagName === 'input' || tagName === 'label') {
      // ...
    } else {
      event.preventDefault()
    }
  }

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
  const allControls_ = mergeControls(
    commonProps,
    controls,
    extensionControls,
    extendControls
  )
  allControls.current = allControls_

  return (
    <div
      className={`bf-controlbar ${className || ''}`}
      style={style}
      onMouseDown={preventDefault}
      role='button'
      tabIndex={0}
    >
      {allControls_.map(item => {
        const itemKey = typeof item === 'string' ? item : item.key
        if (typeof itemKey !== 'string') {
          return null
        }
        if (renderedControls.includes(itemKey)) {
          return null
        }
        if (itemKey.toLowerCase() === 'separator') {
          return <span key={uuidv4()} className='separator-line' />
        }
        let controlItem: ControlItem = editorControls.find(subItem => {
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
              onChange={command => applyControl(command, 'block-type')}
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
              // theme={colorPickerTheme}
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
              // defaultCaption={controlItem.title}
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
              type='button'
              key={uuidv4()}
              data-title={controlItem.title}
              disabled={controlItem.disabled}
              className='control-item media button'
              onClick={openFinder}
            >
              {controlItem.text}
            </button>
          )
        }
        if (isDropDownControl(controlItem)) {
          return (
            <DropDown
              key={uuidv4()}
              className={`control-item extend-control-item dropdown ${controlItem.className ||
                ''}`}
              caption={controlItem.text}
              htmlCaption={controlItem.html}
              showArrow={controlItem.showArrow}
              title={controlItem.title}
              arrowActive={controlItem.arrowActive}
              // theme={controlItem.theme}
              autoHide={controlItem.autoHide}
              disabled={controlItem.disabled}
              ref={(controlItem as any).ref}
              {...commonProps}
            >
              {controlItem.component}
            </DropDown>
          )
        }
        if (isModalControl(controlItem)) {
          return (
            <button
              type='button'
              key={uuidv4()}
              data-title={controlItem.title}
              disabled={controlItem.disabled}
              className={`control-item extend-control-item button ${controlItem.className ||
                ''}`}
              dangerouslySetInnerHTML={
                controlItem.html ? { __html: controlItem.html } : null
              }
              onClick={event => {
                const { modal, onClick } = controlItem as ModalControlItem
                if (modal?.id) {
                  if (extendedModals.current?.[modal.id]) {
                    extendedModals.current[modal.id].active = true
                    extendedModals.current[modal.id].update({
                      ...modal,
                      language
                    })
                  } else {
                    extendedModals.current[modal.id] = showModal({
                      ...modal,
                      language
                    })
                    modal.onCreate?.(
                      extendedModals.current[modal.id]
                    )
                  }
                }
                onClick?.(event)
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
        if (isButtonControl(controlItem)) {
          return (
            <button
              type='button'
              key={uuidv4()}
              data-title={controlItem.title}
              disabled={controlItem.disabled}
              className={`control-item button ${controlItem.className || ''}`}
              dangerouslySetInnerHTML={
                controlItem.html ? { __html: controlItem.html } : null
              }
              onClick={event => (controlItem as ButtonControlItem).onClick?.(event)}
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
              type='button'
              key={uuidv4()}
              disabled={disabled}
              data-title={controlItem.title}
              className={getControlTypeClassName({
                type: controlItem.type,
                command: controlItem.command
              })}
              onClick={() =>
                applyControl(
                  controlItem.command,
                  controlItem.type,
                  (controlItem as any).data
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

export default ControlBar
