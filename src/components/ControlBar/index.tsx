import { classNameParser } from '../../utils/style'
import React, {
  CSSProperties,
  useImperativeHandle,
  forwardRef,
  useMemo,
  useState,
  useRef,
  useEffect,
  useCallback
} from 'react'
import { v4 as uuidv4 } from 'uuid'
import {
  selectionHasInlineStyle,
  getSelectionBlockType,
  getSelectionEntityType,
  toggleSelectionInlineStyle,
  toggleSelectionBlockType,
  toggleSelectionEntity,
  insertMedias
} from '../../utils'

import loadable from '@loadable/component'

import {
  MediaProps,
  ControlItem,
  CommonPickerProps,
  ModalControlItem,
  ButtonControlItem,
  DropDownControlItem,
  EditorState,
  Language,
  ModalProps,
  EditorMode,
  CustomCompontentProps
} from '../../types'
import styles from './style.module.scss'
import useLanguage from '../../hooks/use-language'

import { tablerIconProps } from '../../constants'

import SuperscriptIcon from 'tabler-icons-react/dist/icons/superscript'
import SubscriptIcon from 'tabler-icons-react/dist/icons/subscript'
import BlockquoteIcon from 'tabler-icons-react/dist/icons/blockquote'
import MusicIcon from 'tabler-icons-react/dist/icons/music'
import ArrowBackUpIcon from 'tabler-icons-react/dist/icons/arrow-back-up'
import ArrowForwardUpIcon from 'tabler-icons-react/dist/icons/arrow-forward-up'
import EraserIcon from 'tabler-icons-react/dist/icons/eraser'
import MinusIcon from 'tabler-icons-react/dist/icons/minus'
import BoldIcon from 'tabler-icons-react/dist/icons/bold'
import CodeIcon from 'tabler-icons-react/dist/icons/code'
import ItalicIcon from 'tabler-icons-react/dist/icons/italic'
import ListIcon from 'tabler-icons-react/dist/icons/list'
import ListNumbersIcon from 'tabler-icons-react/dist/icons/list-numbers'
import MaximizeIcon from 'tabler-icons-react/dist/icons/maximize'
import MaximizeOffIcon from 'tabler-icons-react/dist/icons/maximize-off'
import MoodEmptyIcon from 'tabler-icons-react/dist/icons/mood-empty'
import StrikethroughIcon from 'tabler-icons-react/dist/icons/strikethrough'
import UnderlineIcon from 'tabler-icons-react/dist/icons/underline'
import TrashIcon from 'tabler-icons-react/dist/icons/trash'

const cls = classNameParser(styles)

const Finder = loadable(async () => await import('../Finder'))
const LinkEditor = loadable(async () => await import('../LinkEditor'))
const HeadingPicker = loadable(async () => await import('../Headings'))
const TextColorPicker = loadable(async () => await import('../TextColor'))
const FontSizePicker = loadable(async () => await import('../FontSize'))
const LineHeightPicker = loadable(async () => await import('../LineHeight'))
const FontFamilyPicker = loadable(async () => await import('../FontFamily'))
const TextAlign = loadable(async () => await import('../TextAlign'))
const EmojiPicker = loadable(async () => await import('../EmojiPicker'))
const LetterSpacingPicker = loadable(
  async () => await import('../LetterSpacing')
)
const TextIndent = loadable(async () => await import('../TextIndent'))
const DropDown = loadable(async () => await import('../DropDown'))
const Button = loadable(async () => await import('../Button'))
const Modal = loadable(async () => await import('../Modal'))
const HTMLButton = loadable(async () => await import('../HTML'))

const isModalControl = (control: ControlItem): control is ModalControlItem => {
  return control.type === 'modal'
}

const isButtonControl = (
  control: ControlItem
): control is ButtonControlItem => {
  return control.type === 'button'
}

const isDropDownControl = (
  control: ControlItem
): control is DropDownControlItem => {
  return control.type === 'dropdown'
}

const exclusiveInlineStyles = {
  superscript: 'subscript',
  subscript: 'superscript'
}

const getEditorControlMap = (
  lang: Language,
  isFullscreen: boolean,
  mode: EditorMode
): Record<string, ControlItem> => {
  return {
    undo: {
      key: 'undo',
      title: lang.controls.undo,
      text: <ArrowBackUpIcon {...tablerIconProps} />,
      type: 'editor-method',
      command: 'undo'
    },
    redo: {
      key: 'redo',
      title: lang.controls.redo,
      text: <ArrowForwardUpIcon {...tablerIconProps} />,
      type: 'editor-method',
      command: 'redo'
    },
    'remove-styles': {
      key: 'remove-styles',
      title: lang.controls.removeStyles,
      text: <EraserIcon {...tablerIconProps} />,
      type: 'editor-method',
      command: 'removeSelectionInlineStyles'
    },
    hr: {
      key: 'hr',
      title: lang.controls.hr,
      text: <MinusIcon {...tablerIconProps} />,
      type: 'editor-method',
      command: 'insertHorizontalLine'
    },
    bold: {
      key: 'bold',
      title: lang.controls.bold,
      text: <BoldIcon {...tablerIconProps} />,
      type: 'inline-style',
      command: 'bold'
    },
    italic: {
      key: 'italic',
      title: lang.controls.italic,
      text: <ItalicIcon {...tablerIconProps} />,
      type: 'inline-style',
      command: 'italic'
    },
    underline: {
      key: 'underline',
      title: lang.controls.underline,
      text: <UnderlineIcon {...tablerIconProps} />,
      type: 'inline-style',
      command: 'underline'
    },
    'strike-through': {
      key: 'strike-through',
      title: lang.controls.strikeThrough,
      text: <StrikethroughIcon {...tablerIconProps} />,
      type: 'inline-style',
      command: 'strikethrough'
    },
    superscript: {
      key: 'superscript',
      title: lang.controls.superScript,
      text: <SuperscriptIcon strokeWidth={1} size={20} />,
      type: 'inline-style',
      command: 'superscript'
    },
    subscript: {
      key: 'subscript',
      title: lang.controls.subScript,
      text: <SubscriptIcon strokeWidth={1} size={20} />,
      type: 'inline-style',
      command: 'subscript'
    },
    headings: {
      key: 'headings',
      title: lang.controls.headings,
      type: 'headings'
    },
    blockquote: {
      key: 'blockquote',
      title: lang.controls.blockQuote,
      text: <BlockquoteIcon strokeWidth={1} size={20} />,
      type: 'block-type',
      command: 'blockquote'
    },
    code: {
      key: 'code',
      title: lang.controls.code,
      text: <CodeIcon {...tablerIconProps} />,
      type: 'block-type',
      command: 'code-block'
    },
    'list-ul': {
      key: 'list-ul',
      title: lang.controls.unorderedList,
      text: <ListIcon {...tablerIconProps} />,
      type: 'block-type',
      command: 'unordered-list-item'
    },
    'list-ol': {
      key: 'list-ol',
      title: lang.controls.orderedList,
      text: <ListNumbersIcon {...tablerIconProps} />,
      type: 'block-type',
      command: 'ordered-list-item'
    },
    link: {
      key: 'link',
      title: lang.controls.link,
      type: 'link'
    },
    'text-color': {
      key: 'text-color',
      title: lang.controls.color,
      type: 'text-color'
    },
    'line-height': {
      key: 'line-height',
      title: lang.controls.lineHeight,
      type: 'line-height'
    },
    'letter-spacing': {
      key: 'letter-spacing',
      title: lang.controls.letterSpacing,
      type: 'letter-spacing'
    },
    'text-indent': {
      key: 'text-indent',
      title: lang.controls.textIndent,
      type: 'text-indent'
    },
    'font-size': {
      key: 'font-size',
      title: lang.controls.fontSize,
      type: 'font-size'
    },
    'font-family': {
      key: 'font-family',
      title: lang.controls.fontFamily,
      type: 'font-family'
    },
    'text-align': {
      key: 'text-align',
      title: lang.controls.textAlign,
      type: 'text-align'
    },
    media: {
      key: 'media',
      title: lang.controls.media,
      text: <MusicIcon strokeWidth={1} size={20} />,
      type: 'media'
    },
    emoji: {
      key: 'emoji',
      title: lang.controls.emoji,
      text: <MoodEmptyIcon {...tablerIconProps} />,
      type: 'emoji'
    },
    clear: {
      key: 'clear',
      title: lang.controls.clear,
      text: <TrashIcon {...tablerIconProps} />,
      type: 'editor-method',
      command: 'clearEditorContent'
    },
    fullscreen: {
      key: 'fullscreen',
      title: isFullscreen
        ? lang.controls.exitFullscreen
        : lang.controls.fullscreen,
      text: isFullscreen
        ? (
        <MaximizeOffIcon {...tablerIconProps} />
          )
        : (
        <MaximizeIcon {...tablerIconProps} />
          ),
      type: 'editor-method',
      command: 'toggleFullscreen'
    },
    html: {
      key: 'html',
      title: 'HTML',
      text: <HTMLButton mode={mode} />,
      type: 'editor-method',
      command: 'toggleHtml'
    },
    modal: {
      key: 'modal',
      type: 'modal'
    },
    button: {
      key: 'button',
      type: 'button'
    },
    dropdown: {
      key: 'dropdown',
      type: 'dropdown'
    },
    component: {
      key: 'component',
      type: 'component'
    }
  }
}

const mergeControls = (builtInControls, parsedExtendControls) => {
  if (!(parsedExtendControls?.length > 0)) {
    return builtInControls
  }

  return builtInControls
    .map((item) => {
      return (
        parsedExtendControls.find((subItem) => {
          return subItem.replace === (item.key || item)
        }) || item
      )
    })
    .concat(
      parsedExtendControls.filter((item) => {
        return typeof item === 'string' || !item.replace
      })
    )
}

export interface ControlBarProps extends CommonPickerProps {
  className: string
  style?: CSSProperties
  allowInsertLinkText: boolean
  media: MediaProps
  controls: readonly ControlItem[]
  editorId: string
  extendControls: ControlItem[]
  textBackgroundColor: boolean
  onRequestFocus: () => void
  isFullscreen: boolean
  onChange: (
    editorState: EditorState,
    callback?: (state: EditorState) => void
  ) => void
  commands: Record<string, () => void>
  mode: EditorMode
}

interface ControlBarForwardRef {
  closeFinder: () => void
  uploadImage: (file, callback) => void
}

const ControlBar = forwardRef<ControlBarForwardRef, ControlBarProps>(
  (
    {
      editorState,
      media,
      allowInsertLinkText,
      className,
      controls,
      editorId,
      extendControls,
      getContainerNode,
      style,
      textBackgroundColor,
      onRequestFocus,
      isFullscreen,
      mode,
      commands,
      onChange
    },
    ref
  ) => {
    useImperativeHandle(ref, () => ({
      closeFinder,
      uploadImage
    }))

    useEffect(() => {
      return () => {
        closeFinder()
      }
    }, [])

    const [mediaLibraryVisible, setMediaLibraryVisible] = useState(false)
    const [extendModal, setExtendModal] = useState<ModalProps | null>(null)
    const finderRef = useRef(null)

    const getControlTypeClassName = (data) => {
      let className = ''
      const { type, command } = data

      if (
        type === 'inline-style' &&
        selectionHasInlineStyle(editorState, command)
      ) {
        className += ' active'
      } else if (
        type === 'block-type' &&
        getSelectionBlockType(editorState) === command
      ) {
        className += ' active'
      } else if (
        type === 'entity' &&
        getSelectionEntityType(editorState) === command
      ) {
        className += ' active'
      }

      return className
    }

    const applyControl = (command: string, type: string, data: any = {}) => {
      const hookCommand = command

      if (type === 'inline-style') {
        const exclusiveInlineStyle = exclusiveInlineStyles[hookCommand]
        if (
          exclusiveInlineStyle &&
          selectionHasInlineStyle(editorState, exclusiveInlineStyle)
        ) {
          editorState = toggleSelectionInlineStyle(
            editorState,
            exclusiveInlineStyle
          )
        }
        onChange(toggleSelectionInlineStyle(editorState, hookCommand))
      }
      if (type === 'block-type') {
        onChange(toggleSelectionBlockType(editorState, hookCommand))
      }
      if (type === 'entity') {
        onChange(
          toggleSelectionEntity(editorState, {
            type: hookCommand,
            mutability: data.mutability || 'MUTABLE',
            data: data.data || {}
          })
        )
      }
      if (type === 'editor-method' && commands[hookCommand]) {
        commands[hookCommand]()
      }
    }

    const openFinder = () => {
      setMediaLibraryVisible(true)
    }

    const insertMedias_ = (medias) => {
      onChange(insertMedias(editorState, medias))
      onRequestFocus()
      media.onInsert?.(medias)
      closeFinder()
    }

    const closeFinder = () => {
      media.onCancel?.()
      setMediaLibraryVisible(false)
    }

    const uploadImage = useCallback(
      (file, callback) => {
        finderRef.current?.uploadImage(file, callback)
      },
      [finderRef.current?.uploadImage]
    )

    const preventDefault = (event) => {
      const tagName = event.target.tagName.toLowerCase()

      if (tagName !== 'input' && tagName !== 'label') {
        event.preventDefault()
      }
    }

    const currentBlockType = getSelectionBlockType(editorState)
    const commonProps = useMemo(
      () => ({
        editorId,
        editorState,
        getContainerNode,
        onChange,
        onRequestFocus
      }),
      [editorId, editorState, getContainerNode, onChange, onRequestFocus]
    )

    const language = useLanguage()

    const editorControlMap = useMemo(
      () => getEditorControlMap(language, isFullscreen, mode),
      [language, isFullscreen, mode]
    )

    const parsedExtendControls = useMemo(() => {
      return extendControls.map((item: any) =>
        typeof item === 'function' ? item(commonProps) : item
      )
    }, [extendControls, commonProps])

    const allControls = useMemo(() => {
      return mergeControls(controls, parsedExtendControls)
    }, [controls, extendControls])

    const renderedControlList = useMemo(() => {
      const keySet = new Set<string>()
      return allControls
        .filter((item) => {
          const itemKey = typeof item === 'string' ? item : item?.key
          if (
            typeof itemKey !== 'string' ||
            itemKey.length === 0 ||
            keySet.has(itemKey)
          ) {
            return false
          }
          keySet.add(itemKey)
          return true
        })
        .map((item) => {
          return [item, uuidv4()] as const
        })
    }, [allControls])

    const isControlDisabled = (control: ControlItem): boolean => {
      if (control.disabled) {
        return true
      }

      if (mode === 'html' && control.key !== 'html') {
        return true
      }

      if (control.command === 'undo') {
        return editorState.getUndoStack().size === 0
      } else if (control.command === 'redo') {
        return editorState.getRedoStack().size === 0
      }
      return false
    }

    return (
      <div
        className={cls(`kedao-controlbar ${className || ''}`)}
        style={style}
        onMouseDown={preventDefault}
        role="button"
        tabIndex={0}
      >
        {renderedControlList.map(([item, key]) => {
          const itemKey = typeof item === 'string' ? item : item.key
          if (itemKey.toLowerCase() === 'separator') {
            return <span key={key} className={cls('separator-line')} />
          }
          let controlItem: ControlItem =
            editorControlMap[itemKey.toLowerCase()]
          if (typeof item !== 'string') {
            controlItem = { ...controlItem, ...item }
          }
          if (!controlItem) {
            return null
          }
          const disabled = isControlDisabled(controlItem)
          const controlStateProps = { disabled }
          if (controlItem.type === 'headings') {
            return (
              <HeadingPicker
                key={key}
                current={currentBlockType}
                {...commonProps}
                {...controlStateProps}
                onChange={(command) => applyControl(command, 'block-type')}
              />
            )
          }
          if (controlItem.type === 'text-color') {
            return (
              <TextColorPicker
                key={key}
                enableBackgroundColor={textBackgroundColor}
                {...commonProps}
                {...controlStateProps}
              />
            )
          }
          if (controlItem.type === 'font-size') {
            return (
              <FontSizePicker
                key={key}
                defaultCaption={controlItem.title}
                {...commonProps}
                {...controlStateProps}
              />
            )
          }
          if (controlItem.type === 'line-height') {
            return (
              <LineHeightPicker
                key={key}
                defaultCaption={controlItem.title}
                {...commonProps}
                {...controlStateProps}
              />
            )
          }
          if (controlItem.type === 'letter-spacing') {
            return (
              <LetterSpacingPicker
                key={key}
                defaultCaption={controlItem.title}
                {...commonProps}
                {...controlStateProps}
              />
            )
          }
          if (controlItem.type === 'text-indent') {
            return (
              <TextIndent key={key} {...commonProps} {...controlStateProps} />
            )
          }
          if (controlItem.type === 'font-family') {
            return (
              <FontFamilyPicker
                key={key}
                defaultCaption={controlItem.title}
                {...commonProps}
                {...controlStateProps}
              />
            )
          }
          if (controlItem.type === 'emoji') {
            return (
              <EmojiPicker
                key={key}
                defaultCaption={controlItem.text}
                {...commonProps}
                {...controlStateProps}
              />
            )
          }
          if (controlItem.type === 'link') {
            return (
              <LinkEditor
                key={key}
                allowInsertLinkText={allowInsertLinkText}
                onChange={onChange}
                onRequestFocus={onRequestFocus}
                {...commonProps}
                {...controlStateProps}
              />
            )
          }
          if (controlItem.type === 'text-align') {
            return (
              <TextAlign key={key} {...commonProps} {...controlStateProps} />
            )
          }
          if (controlItem.type === 'media') {
            if (!media.image && !media.video && !media.audio) {
              return null
            }
            return (
              <Button
                type="button"
                key={key}
                data-title={controlItem.title}
                className={cls('media')}
                onClick={openFinder}
                {...controlStateProps}
              >
                {controlItem.text}
              </Button>
            )
          }
          if (isDropDownControl(controlItem)) {
            return (
              <DropDown
                key={key}
                className={cls(
                  `extend-control-item ${controlItem.className || ''}`
                )}
                caption={controlItem.text}
                htmlCaption={controlItem.html}
                showArrow={controlItem.showArrow}
                title={controlItem.title}
                arrowActive={controlItem.arrowActive}
                autoHide={controlItem.autoHide}
                ref={(controlItem as any).ref}
                {...commonProps}
                {...controlStateProps}
              >
                {controlItem.component}
              </DropDown>
            )
          }
          if (isModalControl(controlItem)) {
            return (
              <Button
                type="button"
                key={key}
                data-title={controlItem.title}
                className={cls(
                  `extend-control-item ${controlItem.className || ''}`
                )}
                dangerouslySetInnerHTML={
                  controlItem.html ? { __html: controlItem.html } : null
                }
                onClick={(event) => {
                  const { modal, onClick } = controlItem as ModalControlItem
                  if (modal?.id) {
                    setExtendModal(modal)
                  }
                  onClick?.(event)
                }}
                {...controlStateProps}
              >
                {!controlItem.html ? controlItem.text : null}
              </Button>
            )
          }
          if (controlItem.type === 'component') {
            return (
              <div
                key={key}
                className={cls(
                  `component-wrapper ${controlItem.className || ''}`
                )}
              >
                {typeof controlItem.component === 'function'
                  ? React.createElement(
                    controlItem.component as React.FC<CustomCompontentProps>,
                    { ...commonProps, ...controlStateProps }
                  )
                  : controlItem.component}
              </div>
            )
          }
          if (isButtonControl(controlItem)) {
            return (
              <Button
                type="button"
                key={key}
                data-title={controlItem.title}
                className={cls(controlItem.className || '')}
                dangerouslySetInnerHTML={
                  controlItem.html ? { __html: controlItem.html } : null
                }
                onClick={(event) =>
                  (controlItem as ButtonControlItem).onClick?.(event)
                }
                {...controlStateProps}
              >
                {!controlItem.html ? controlItem.text : null}
              </Button>
            )
          }
          if (controlItem) {
            return (
              <Button
                type="button"
                key={key}
                data-title={controlItem.title}
                className={cls(
                  getControlTypeClassName({
                    type: controlItem.type,
                    command: controlItem.command
                  })
                )}
                onClick={() =>
                  applyControl(
                    controlItem.command,
                    controlItem.type,
                    (controlItem as any).data
                  )
                }
                {...controlStateProps}
              >
                {controlItem.text}
              </Button>
            )
          }
          return null
        })}
        {mediaLibraryVisible && (
          <Modal
            title={language.controls.mediaLibirary}
            width={640}
            showFooter={false}
            onClose={closeFinder}
            visible={mediaLibraryVisible}
          >
            <Finder
              ref={finderRef}
              {...media}
              onCancel={closeFinder}
              onInsert={insertMedias_}
            />
          </Modal>
        )}
        {extendModal && <Modal key={extendModal.id} {...extendModal} />}
      </div>
    )
  }
)

export default ControlBar
