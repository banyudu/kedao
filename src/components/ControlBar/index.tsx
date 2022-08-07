
import { classNameParser } from '../../utils/style'
import Finder from '../Finder'
import React, {
  CSSProperties,
  useImperativeHandle,
  forwardRef,
  useMemo,
  useState,
  useRef,
  useEffect
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
import LinkEditor, { LinkEditorProps } from '../LinkEditor'
import HeadingPicker, { HeadingsPickerProps } from '../Headings'
import TextColorPicker from '../TextColor'
import FontSizePicker, { FontSizePickerProps } from '../FontSize'
import LineHeightPicker, { LineHeightPickerProps } from '../LineHeight'
import FontFamilyPicker, { FontFamilyPickerProps } from '../FontFamily'
import TextAlign, { TextAlignProps } from '../TextAlign'
import EmojiPicker, { EmojiPickerProps } from '../EmojiPicker'
import LetterSpacingPicker, {
  LetterSpacingPickerProps
} from '../LetterSpacing'
import TextIndent from '../TextIndent'
import DropDown from '../DropDown'
import Button from '../Button'
import Modal from '../Modal'
import Icon from '../Icon'
import {
  MediaProps,
  ControlItem,
  CommonPickerProps,
  ModalControlItem,
  ButtonControlItem,
  DropDownControlItem,
  EditorState,
  Language,
  ModalProps
} from '../../types'
import styles from './style.module.scss'
import { useDeepCompareMemo } from '../../utils/use-deep-compare-memo'
const cls = classNameParser(styles)

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
  isFullscreen: boolean
): Record<string, ControlItem> => {
  return {
    undo: {
      key: 'undo',
      title: lang.controls.undo,
      text: <Icon type='undo' />,
      type: 'editor-method',
      command: 'undo'
    },
    redo: {
      key: 'redo',
      title: lang.controls.redo,
      text: <Icon type='redo' />,
      type: 'editor-method',
      command: 'redo'
    },
    'remove-styles': {
      key: 'remove-styles',
      title: lang.controls.removeStyles,
      text: <Icon type='clear' />,
      type: 'editor-method',
      command: 'removeSelectionInlineStyles'
    },
    hr: {
      key: 'hr',
      title: lang.controls.hr,
      text: <Icon type='horizontal-rule' />,
      type: 'editor-method',
      command: 'insertHorizontalLine'
    },
    bold: {
      key: 'bold',
      title: lang.controls.bold,
      text: <Icon type='format-bold' />,
      type: 'inline-style',
      command: 'bold'
    },
    italic: {
      key: 'italic',
      title: lang.controls.italic,
      text: <Icon type='format-italic' />,
      type: 'inline-style',
      command: 'italic'
    },
    underline: {
      key: 'underline',
      title: lang.controls.underline,
      text: <Icon type='format-underlined' />,
      type: 'inline-style',
      command: 'underline'
    },
    'strike-through': {
      key: 'strike-through',
      title: lang.controls.strikeThrough,
      text: <Icon type='format-strikethrough' />,
      type: 'inline-style',
      command: 'strikethrough'
    },
    superscript: {
      key: 'superscript',
      title: lang.controls.superScript,
      text: <Icon type='superscript' />,
      type: 'inline-style',
      command: 'superscript'
    },
    subscript: {
      key: 'subscript',
      title: lang.controls.subScript,
      text: <Icon type='subscript' />,
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
      text: <Icon type='format-quote' />,
      type: 'block-type',
      command: 'blockquote'
    },
    code: {
      key: 'code',
      title: lang.controls.code,
      text: <Icon type='code' />,
      type: 'block-type',
      command: 'code-block'
    },
    'list-ul': {
      key: 'list-ul',
      title: lang.controls.unorderedList,
      text: <Icon type='format-list-bulleted' />,
      type: 'block-type',
      command: 'unordered-list-item'
    },
    'list-ol': {
      key: 'list-ol',
      title: lang.controls.orderedList,
      text: <Icon type='format-list-numbered' />,
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
      text: <Icon type='library-music' />,
      type: 'media'
    },
    emoji: {
      key: 'emoji',
      title: lang.controls.emoji,
      text: <Icon type='insert-emoticon' />,
      type: 'emoji'
    },
    clear: {
      key: 'clear',
      title: lang.controls.clear,
      text: <Icon type='clear-all' />,
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
        <Icon type='fullscreen-exit' />
          )
        : (
        <Icon type='fullscreen' />
          ),
      type: 'editor-method',
      command: 'toggleFullscreen'
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

const mergeControls = (
  commonProps,
  builtControls,
  extendControls
) => {
  const customExtendControls = extendControls.map((item) =>
    typeof item === 'function' ? item(commonProps) : item
  )

  if (customExtendControls.length === 0) {
    return builtControls
  }

  return builtControls
    .map((item) => {
      return (
        customExtendControls.find((subItem) => {
          return subItem.replace === (item.key || item)
        }) ||
        item
      )
    })
    .concat(
      customExtendControls.filter((item) => {
        return typeof item === 'string' || !item.replace
      })
    )
}

export interface ControlBarProps
  extends CommonPickerProps,
  Pick<EmojiPickerProps, 'emojis'>,
  Pick<FontFamilyPickerProps, 'fontFamilies'>,
  Pick<FontSizePickerProps, 'fontSizes'>,
  Pick<HeadingsPickerProps, 'headings'>,
  Pick<LetterSpacingPickerProps, 'letterSpacings'>,
  Pick<LineHeightPickerProps, 'lineHeights'>,
  Pick<TextAlignProps, 'textAligns'>,
  Pick<LinkEditorProps, 'defaultLinkTarget'> {
  className: string
  style: CSSProperties
  colors: string[]
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
}

interface ControlBarForwardRef {
  closeFinder: () => void
  uploadImage: (file, callback) => void
}

const ControlBar = forwardRef<ControlBarForwardRef, ControlBarProps>(
  (
    {
      language,
      editorState,
      media,
      allowInsertLinkText,
      className,
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
      textBackgroundColor,
      onRequestFocus,
      isFullscreen,
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

    const uploadImage = (file, callback) => {
      finderRef.current?.uploadImage(file, callback)
    }

    const preventDefault = (event) => {
      const tagName = event.target.tagName.toLowerCase()

      if (tagName !== 'input' && tagName !== 'label') {
        event.preventDefault()
      }
    }

    const currentBlockType = getSelectionBlockType(editorState)
    const commonProps = {
      editorId,
      editorState,
      language,
      getContainerNode,
      onChange: onChange,
      onRequestFocus: onRequestFocus
    }

    const editorControlMap = useMemo(
      () => getEditorControlMap(language, isFullscreen),
      [language, isFullscreen]
    )
    const allControls = useDeepCompareMemo(() => {
      return mergeControls(
        commonProps,
        controls,
        extendControls
      )
    }, [
      mergeControls,
      commonProps,
      controls,
      extendControls
    ])
    const renderedControlList = useDeepCompareMemo(() => {
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
          if (controlItem.type === 'headings') {
            return (
              <HeadingPicker
                key={key}
                headings={headings}
                current={currentBlockType}
                {...commonProps}
                onChange={(command) => applyControl(command, 'block-type')}
              />
            )
          }
          if (controlItem.type === 'text-color') {
            return (
              <TextColorPicker
                key={key}
                colors={colors}
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
            return <TextIndent key={uuidv4()} {...commonProps} />
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
                key={key}
                defaultLinkTarget={defaultLinkTarget}
                allowInsertLinkText={allowInsertLinkText}
                onChange={onChange}
                onRequestFocus={onRequestFocus}
                {...commonProps}
              />
            )
          }
          if (controlItem.type === 'text-align') {
            return (
              <TextAlign key={key} textAligns={textAligns} {...commonProps} />
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
                disabled={controlItem.disabled}
                className={cls('media')}
                onClick={openFinder}
              >
                {controlItem.text}
              </Button>
            )
          }
          if (isDropDownControl(controlItem)) {
            return (
              <DropDown
                key={key}
                className={cls(`extend-control-item ${controlItem.className || ''}`)}
                caption={controlItem.text}
                htmlCaption={controlItem.html}
                showArrow={controlItem.showArrow}
                title={controlItem.title}
                arrowActive={controlItem.arrowActive}
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
              <Button
                type="button"
                key={key}
                data-title={controlItem.title}
                disabled={controlItem.disabled}
                className={cls(`extend-control-item ${controlItem.className || ''}`)}
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
              >
                {!controlItem.html ? controlItem.text : null}
              </Button>
            )
          }
          if (controlItem.type === 'component') {
            return (
              <div
                key={key}
                className={cls(`component-wrapper ${controlItem.className || ''}`)}
              >
                {controlItem.component}
              </div>
            )
          }
          if (isButtonControl(controlItem)) {
            return (
              <Button
                type="button"
                key={key}
                data-title={controlItem.title}
                disabled={controlItem.disabled}
                className={cls(controlItem.className || '')}
                dangerouslySetInnerHTML={
                  controlItem.html ? { __html: controlItem.html } : null
                }
                onClick={(event) =>
                  (controlItem as ButtonControlItem).onClick?.(event)
                }
              >
                {!controlItem.html ? controlItem.text : null}
              </Button>
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
              <Button
                type="button"
                key={key}
                disabled={disabled}
                data-title={controlItem.title}
                className={cls(getControlTypeClassName({
                  type: controlItem.type,
                  command: controlItem.command
                }))}
                onClick={() =>
                  applyControl(
                    controlItem.command,
                    controlItem.type,
                    (controlItem as any).data
                  )
                }
              >
                {controlItem.text}
              </Button>
            )
          }
          return null
        })}
        <Modal
          title={language.controls.mediaLibirary}
          language={language}
          width={640}
          showFooter={false}
          onClose={closeFinder}
          visible={mediaLibraryVisible}
        >
          <Finder
            ref={finderRef}
            language={language}
            {...media}
            onCancel={closeFinder}
            onInsert={insertMedias_}
          />
        </Modal>
        {extendModal && (
          <Modal key={extendModal.id} {...extendModal} language={language} />
        )}
      </div>
    )
  }
)

export default ControlBar
