
import { classNameParser } from '../utils/style'
import React, {
  FC,
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback
} from 'react'
import Finder from '../finder'
import {
  toggleSelectionIndent,
  insertHorizontalLine,
  undo,
  redo,
  insertHTML,
  increaseSelectionIndent,
  getSelectedBlocks,
  insertMedias,
  detectColorsFromHTMLString,
  handleKeyCommand,
  removeBlock,
  getSelectionBlock,
  removeSelectionInlineStyles,
  getSelectionBlockType,
  decreaseSelectionIndent,
  detectColorsFromDraftState,
  toggleSelectionBlockType,
  insertText,
  handleNewLine,
  clear
} from '../utils'
import {
  Editor,
  EditorProps,
  RichUtils,
  Modifier,
  EditorState,
  ContentState
} from 'draft-js'
import { Map } from 'immutable'
import mergeClassNames from 'merge-class-names'
import { Provider as JotaiProvider } from 'jotai'

import languages from '../languages'
import getKeyBindingFn from '../configs/keybindings'
import defaultProps from '../configs/props'
import {
  getBlockRendererFn,
  getBlockRenderMap,
  getBlockStyleFn,
  getCustomStyleMap,
  getCustomStyleFn,
  getDecorators
} from '../renderers'
import {
  compositeStyleImportFn,
  compositeStyleExportFn,
  compositeEntityImportFn,
  compositeEntityExportFn,
  compositeBlockImportFn,
  compositeBlockExportFn,
  getPropInterceptors
  // useExtension
} from '../helpers/extension'
import ControlBar, { ControlBarProps } from '../components/ControlBar'

import 'draft-js/dist/Draft.css'
import styles from './style.module.scss'
import {
  CallbackEditor,
  ControlItem,
  BuiltInControlNames,
  DropDownControlItem,
  ButtonControlItem,
  ModalControlItem,
  MediaType,
  MediaProps,
  Hooks,
  ImageControlItem,
  ConvertOptions
} from '../types'
import {
  convertEditorStateToRaw,
  convertRawToEditorState,
  convertHTMLToEditorState,
  convertEditorStateToHTML
} from '../convert'

import getFragmentFromSelection from 'draft-js/lib/getFragmentFromSelection'
const cls = classNameParser(styles)

export const createStateFromContent = (
  content,
  options: ConvertOptions = {}
) => {
  const customOptions: ConvertOptions = { ...options }
  customOptions.unitExportFn =
    customOptions.unitExportFn || defaultProps.converts.unitExportFn
  customOptions.styleImportFn = compositeStyleImportFn(
    customOptions.styleImportFn,
    customOptions.editorId
  )
  customOptions.entityImportFn = compositeEntityImportFn(
    customOptions.entityImportFn,
    customOptions.editorId
  )
  customOptions.blockImportFn = compositeBlockImportFn(
    customOptions.blockImportFn,
    customOptions.editorId
  )

  let editorState: EditorState = null

  if (content instanceof EditorState) {
    editorState = content
  }
  if (
    typeof content === 'object' &&
    content &&
    content.blocks &&
    content.entityMap
  ) {
    editorState = convertRawToEditorState(
      content,
      getDecorators(customOptions.editorId)
    )
  }
  if (typeof content === 'string') {
    try {
      if (/^(-)?\d+$/.test(content)) {
        editorState = convertHTMLToEditorState(
          content,
          getDecorators(customOptions.editorId),
          customOptions,
          'create'
        )
      } else {
        editorState = createStateFromContent(
          JSON.parse(content),
          customOptions
        )
      }
    } catch (error) {
      editorState = convertHTMLToEditorState(
        content,
        getDecorators(customOptions.editorId),
        customOptions,
        'create'
      )
    }
  } else if (typeof content === 'number') {
    editorState = convertHTMLToEditorState(
      Number(content).toLocaleString().replace(/,/g, ''),
      getDecorators(customOptions.editorId),
      customOptions,
      'create'
    )
  } else {
    editorState = EditorState.createEmpty(
      getDecorators(customOptions.editorId)
    )
  }

  customOptions.styleExportFn = compositeStyleExportFn(
    customOptions.styleExportFn,
    customOptions.editorId
  )
  customOptions.entityExportFn = compositeEntityExportFn(
    customOptions.entityExportFn,
    customOptions.editorId
  )
  customOptions.blockExportFn = compositeBlockExportFn(
    customOptions.blockExportFn,
    customOptions.editorId
  )

  return editorState
}

export interface KedaoEditorProps {
  value?: EditorState
  defaultValue?: EditorState
  placeholder?: string
  id?: string
  editorId?: string
  readOnly?: boolean
  language?:
  | 'zh'
  | 'zh-hant'
  | 'en'
  | 'tr'
  | 'ru'
  | 'jpn'
  | 'kr'
  | 'pl'
  | 'fr'
  | 'vi-vn'
  | ((languages: any, context: any) => any)
  controls?: Array<ControlItem | string>
  excludeControls?: BuiltInControlNames[]
  extendControls?: Array<
  DropDownControlItem | ButtonControlItem | ModalControlItem
  >
  componentBelowControlBar?: React.ReactNode
  media?: MediaType
  imageControls?: ImageControlItem[]
  imageResizable?: boolean
  imageEqualRatio?: boolean
  headings?: string[]
  colors?: string[]
  fontSizes?: number[]
  fontFamilies?: Array<{ name: string, family: string }>
  lineHeights?: number[]
  textAligns?: Array<'left' | 'center' | 'right' | 'justify'>
  letterSpacings?: number[]
  emojis?: string[]
  draftProps?: EditorProps
  blockRenderMap?: Immutable.Map<any, any> | Function
  blockRendererFn?: Function
  customStyleFn?: Function
  customStyleMap?: Function
  blockStyleFn?: Function
  keyBindingFn?: Function
  colorPickerAutoHide?: boolean
  colorPicker?: ControlBarProps['colorPicker']
  converts?: object
  hooks?: Hooks
  textBackgroundColor?: boolean
  allowInsertLinkText?: boolean
  defaultLinkTarget?: string
  stripPastedStyles?: boolean
  fixPlaceholder?: boolean
  className?: string
  style?: React.CSSProperties
  controlBarClassName?: string
  controlBarStyle?: React.CSSProperties
  contentClassName?: string
  contentStyle?: React.CSSProperties
  onChange?: (editorState: EditorState) => void
  onFocus?: Function
  onBlur?: Function
  onTab?: Function
  onDelete?: Function
  onSave?: Function
  onFullscreen?: Function
  handlePastedFiles?: Function
  handleDroppedFiles?: Function
  handlePastedText?: Function
  handleBeforeInput?: Function
  handleReturn?: Function
  handleKeyCommand?: Function
  codeTabIndents?: number
  disabled?: boolean
  extendAtomics?: any[]
}

const buildHooks =
  (hooks) =>
    (hookName, defaultReturns = {}) => {
      return hooks[hookName] || (() => defaultReturns)
    }

const filterColors = (colors: string[], colors2: string[]) => {
  return colors
    .filter((item) => {
      return !colors2.find(
        (color) => color.toLowerCase() === item.toLowerCase()
      )
    })
    .filter((item, index, array) => array.indexOf(item) === index)
}

const isControlEnabled = (
  { controls = [], extendControls = [], excludeControls = [] },
  controlName: string
) => {
  return (
    [...controls, ...extendControls].find(
      (item) => item === controlName || item.key === controlName
    ) && !excludeControls.includes(controlName)
  )
}

const KedaoEditor: FC<KedaoEditorProps> = (props) => {
  const { defaultValue, value, onChange } = props
  const draftInstanceRef = useRef(null)
  const [editorLocked, setEditorLocked] = useState(null)

  const getEditorProps = (): KedaoEditorProps => {
    const { value, defaultValue, onChange, ...restProps } = props // eslint-disable-line no-unused-vars
    const propInterceptors = getPropInterceptors(
      restProps.editorId || restProps.id
    )

    if (propInterceptors.length === 0) {
      return restProps as any
    }

    let propsMap = Map(restProps)

    propInterceptors.forEach((interceptor) => {
      propsMap = propsMap.merge(Map(interceptor(propsMap.toJS(), this) || {}))
    })

    return propsMap.toJS() as any
  }

  const editorProps = useMemo(getEditorProps, [value, defaultValue])
  const editorDecoratorsRef = useRef(
    getDecorators(editorProps.editorId || editorProps.id)
  )
  const controlBarInstanceRef = useRef(null)
  const [isLiving, setIsLiving] = useState(false)
  const valueInitialized = !!(defaultValue || value)

  const defaultEditorState =
    (defaultValue || value) instanceof EditorState
      ? defaultValue || value
      : EditorState.createEmpty(editorDecoratorsRef.current)

  const getConvertOptions = (): ConvertOptions => {
    const { editorId, id, converts, fontFamilies } = editorProps
    const realEditorId = editorId || id
    const result: ConvertOptions = {
      ...defaultProps.converts,
      ...converts,
      fontFamilies: fontFamilies
    }

    result.styleImportFn = compositeStyleImportFn(
      result.styleImportFn,
      realEditorId
    )
    result.styleExportFn = compositeStyleExportFn(
      result.styleExportFn,
      realEditorId
    )
    result.entityImportFn = compositeEntityImportFn(
      result.entityImportFn,
      realEditorId
    )
    result.entityExportFn = compositeEntityExportFn(
      result.entityExportFn,
      realEditorId
    )
    result.blockImportFn = compositeBlockImportFn(
      result.blockImportFn,
      realEditorId
    )
    result.blockExportFn = compositeBlockExportFn(
      result.blockExportFn,
      realEditorId
    )

    return result
  }

  const convertOptions = useMemo(getConvertOptions, [editorProps])

  let _tempColors: string[] = []

  if (defaultEditorState instanceof EditorState) {
    const colors = detectColorsFromDraftState(
      convertEditorStateToRaw(defaultEditorState)
    )
    _tempColors = filterColors(colors, editorProps.colors)
  }

  const [tempColors, setTempColors] = useState(_tempColors)
  const [editorState, setEditorState] = useState(defaultEditorState)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const containerRef = useRef(null)
  const isMediaEnabled = isControlEnabled(editorProps, 'media')

  const finder = useMemo(() => {
    if (!isMediaEnabled) {
      return null
    }
    const { language, media } = editorProps
    const { uploadFn, validateFn, items }: any = {
      ...defaultProps.media,
      ...media
    }

    return new Finder({
      items,
      language,
      uploader: uploadFn,
      validator: validateFn
    })
  }, [isMediaEnabled])

  useEffect(() => {
    setIsLiving(true)

    return () => {
      setIsLiving(false)
      controlBarInstanceRef.current?.closeFinder()
    }
  }, [])

  useEffect(() => {
    const editorState = value
    const { media } = editorProps

    if (media?.items && finder) {
      finder.setItems(media.items)
    }

    let nextEditorState

    if (!valueInitialized && defaultValue instanceof EditorState) {
      nextEditorState = props.defaultValue
    } else if (editorState instanceof EditorState) {
      nextEditorState = editorState
    }

    if (nextEditorState) {
      if (nextEditorState && nextEditorState !== editorState) {
        const tempColors = detectColorsFromDraftState(
          convertEditorStateToRaw(nextEditorState)
        )

        setTempColors((oldColors) =>
          filterColors([...oldColors, ...tempColors], editorProps.colors)
        )
        setEditorState(nextEditorState)
        onChange?.(nextEditorState)
      } else {
        setEditorState(nextEditorState)
      }
    }
  }, [defaultValue, value])

  let handleChange = (
    editorState: EditorState,
    callback?: (state: EditorState) => void
  ) => {
    let newEditorState = editorState
    if (!(editorState instanceof EditorState)) {
      newEditorState = EditorState.set(editorState, {
        decorator: editorDecoratorsRef.current
      })
    }

    setEditorState(newEditorState)
    onChange?.(newEditorState)
    callback?.(newEditorState)
  }

  const setValue = useCallback(
    (editorState: EditorState, callback?: (state: EditorState) => void) => {
      return handleChange(editorState, callback)
    },
    [handleChange]
  )

  const forceRender = () => {
    const selectionState = editorState.getSelection()

    setValue(
      EditorState.set(editorState, {
        decorator: editorDecoratorsRef.current
      }),
      () => {
        setValue(EditorState.forceSelection(editorState, selectionState))
      }
    )
  }

  const keyCommandHandlers = (command: string, editorState: EditorState) => {
    if (
      editorProps.handleKeyCommand?.(command, editorState, callbackEditor) ===
      'handled'
    ) {
      return 'handled'
    }

    if (command === 'kedao-save') {
      editorProps.onSave?.(editorState)
      return 'handled'
    }

    const { controls, excludeControls } = editorProps
    const allowIndent =
      (controls.indexOf('text-indent' as any) !== 0 ||
        controls.find(
          (item) => typeof item !== 'string' && item.key === 'text-indent'
        )) &&
      !excludeControls.includes('text-indent')
    const cursorStart = editorState.getSelection().getStartOffset()
    const cursorEnd = editorState.getSelection().getEndOffset()
    const cursorIsAtFirst = cursorStart === 0 && cursorEnd === 0

    if (command === 'backspace') {
      if (editorProps.onDelete && !editorProps.onDelete?.(editorState)) {
        return 'handled'
      }

      const blockType = getSelectionBlockType(editorState)

      if (allowIndent && cursorIsAtFirst && blockType !== 'code-block') {
        setValue(decreaseSelectionIndent(editorState))
      }
    }

    if (command === 'tab') {
      const blockType = getSelectionBlockType(editorState)

      if (blockType === 'code-block') {
        setValue(
          insertText(editorState, ' '.repeat(editorProps.codeTabIndents))
        )
        return 'handled'
      }
      if (
        blockType === 'ordered-list-item' ||
        blockType === 'unordered-list-item'
      ) {
        const newEditorState = RichUtils.onTab(event as any, editorState, 4)
        if (newEditorState !== editorState) {
          setValue(newEditorState)
        }
        return 'handled'
      }
      if (blockType !== 'atomic' && allowIndent && cursorIsAtFirst) {
        setValue(increaseSelectionIndent(editorState))
        return 'handled'
      }
    }

    const nextEditorState = handleKeyCommand(editorState, command)

    if (nextEditorState) {
      setValue(nextEditorState)
      return 'handled'
    }

    return 'not-handled'
  }

  const onTab = (event) => {
    if (keyCommandHandlers('tab', editorState) === 'handled') {
      event.preventDefault()
    }
    editorProps.onTab?.(event)
  }

  const onFocus = () => {
    editorProps.onFocus?.(editorState)
  }

  const onBlur = () => {
    editorProps.onBlur?.(editorState)
  }

  const requestFocus = () => {
    setTimeout(() => draftInstanceRef.current?.focus(), 0)
  }

  const handleReturn = (event, editorState: EditorState) => {
    if (
      editorProps.handleReturn?.(event, editorState, callbackEditor) ===
      'handled'
    ) {
      return 'handled'
    }

    const currentBlock = getSelectionBlock(editorState)
    const currentBlockType = currentBlock.getType()

    if (
      currentBlockType === 'unordered-list-item' ||
      currentBlockType === 'ordered-list-item'
    ) {
      if (currentBlock.getLength() === 0) {
        setValue(toggleSelectionBlockType(editorState, 'unstyled'))
        return 'handled'
      }

      return 'not-handled'
    }
    if (currentBlockType === 'code-block') {
      if (
        event.which === 13 &&
        (event.getModifierState('Shift') ||
          event.getModifierState('Alt') ||
          event.getModifierState('Control'))
      ) {
        setValue(toggleSelectionBlockType(editorState, 'unstyled'))
        return 'handled'
      }

      return 'not-handled'
    }
    if (currentBlockType === 'blockquote') {
      if (event.which === 13) {
        if (
          event.getModifierState('Shift') ||
          event.getModifierState('Alt') ||
          event.getModifierState('Control')
        ) {
          // eslint-disable-next-line no-param-reassign
          event.which = 0
        } else {
          setValue(RichUtils.insertSoftNewline(editorState))
          return 'handled'
        }
      }
    }

    const nextEditorState = handleNewLine(editorState, event)

    if (nextEditorState) {
      setValue(nextEditorState)
      return 'handled'
    }

    return 'not-handled'
  }

  const handleBeforeInput = (chars, editorState: EditorState) => {
    if (
      editorProps.handleBeforeInput?.(chars, editorState, callbackEditor) ===
      'handled'
    ) {
      return 'handled'
    }

    return 'not-handled'
  }

  const handleDrop = (selectionState, dataTransfer) => {
    if (editorProps.readOnly || editorProps.disabled) {
      return 'handled'
    }

    if ((window as any).__KEDAO_DRAGING__IMAGE__) {
      let nextEditorState: any = EditorState.forceSelection(
        editorState,
        selectionState
      )
      nextEditorState = insertMedias(nextEditorState, [
        (window as any).__KEDAO_DRAGING__IMAGE__.mediaData
      ])
      nextEditorState = removeBlock(
        nextEditorState,
        (window as any).__KEDAO_DRAGING__IMAGE__.block,
        nextEditorState.getSelection()
      );

      (window as any).__KEDAO_DRAGING__IMAGE__ = null

      setEditorLocked(true)
      setValue(nextEditorState)

      return 'handled'
    }
    if (!dataTransfer || !dataTransfer.getText()) {
      return 'handled'
    }

    return 'not-handled'
  }

  const handleFiles = (files) => {
    const { pasteImage, validateFn, imagePasteLimit }: any = {
      ...defaultProps.media,
      ...editorProps.media
    }

    if (pasteImage) {
      files.slice(0, imagePasteLimit).forEach((file) => {
        if (file && file.type.indexOf('image') > -1 && finder) {
          const validateResult = validateFn ? validateFn(file) : true
          if (validateResult instanceof Promise) {
            validateResult
              .then(() => {
                finder.uploadImage(file, (image) => {
                  if (isLiving) {
                    setValue(insertMedias(editorState, [image]))
                  }
                })
              })
              .catch(console.error)
          } else if (validateResult) {
            finder.uploadImage(file, (image) => {
              if (isLiving) {
                setValue(insertMedias(editorState, [image]))
              }
            })
          }
        }
      })
    }

    if (files[0] && files[0].type.indexOf('image') > -1 && pasteImage) {
      return 'handled'
    }

    return 'not-handled'
  }

  const handleDroppedFiles = (selectionState, files) => {
    if (
      editorProps.handleDroppedFiles?.(
        selectionState,
        files,
        callbackEditor
      ) === 'handled'
    ) {
      return 'handled'
    }

    return handleFiles(files)
  }

  const handlePastedFiles = (files) => {
    if (editorProps.handlePastedFiles?.(files, callbackEditor) === 'handled') {
      return 'handled'
    }

    return handleFiles(files)
  }

  const handleCopyContent = (event) => {
    const blockMap = getFragmentFromSelection(editorState)

    if (blockMap?.toArray) {
      try {
        const tempContentState = ContentState.createFromBlockArray(
          blockMap.toArray()
        )
        const tempEditorState = EditorState.createWithContent(tempContentState)
        const clipboardData =
          event.clipboardData ||
          (window as any).clipboardData ||
          event.originalEvent.clipboardData

        const html = convertEditorStateToHTML(tempEditorState, convertOptions)
        const text = tempEditorState.getCurrentContent().getPlainText()

        clipboardData.setData('text/html', html)
        clipboardData.setData('text/plain', text)

        event.preventDefault()
      } catch (error) {
        console.warn(error)
      }
    }
  }

  const handlePastedText = (
    text: string,
    html: string,
    editorState: EditorState
  ) => {
    if (
      editorProps.handlePastedText?.(
        text,
        html,
        editorState,
        callbackEditor
      ) === 'handled'
    ) {
      return 'handled'
    }

    if (!html || editorProps.stripPastedStyles) {
      return false
    }

    const detectedColors = detectColorsFromHTMLString(html)

    setTempColors(
      [...tempColors, ...detectedColors]
        .filter((item) => !editorProps.colors.includes(item))
        .filter((item, index, array) => array.indexOf(item) === index)
    )
    setValue(insertHTML(editorState, convertOptions, html, 'paste'))
    return 'handled'
  }

  const handleCompositionStart = () => {
    const { editorState } = callbackEditor
    const selectedBlocks = getSelectedBlocks(editorState)

    if (selectedBlocks && selectedBlocks.length > 1) {
      const nextEditorState = EditorState.push(
        editorState,
        Modifier.removeRange(
          editorState.getCurrentContent(),
          editorState.getSelection(),
          'backward'
        ),
        'remove-range'
      )

      setValue(nextEditorState)
    }
  }

  let { editorId, controls, language, hooks, placeholder } = editorProps
  const {
    id,
    excludeControls,
    extendControls,
    readOnly,
    disabled,
    colors,
    colorPicker,
    colorPickerAutoHide,
    fontSizes,
    fontFamilies,
    emojis,
    fixPlaceholder,
    headings,
    imageControls,
    imageResizable,
    imageEqualRatio,
    lineHeights,
    letterSpacings,
    media,
    textAligns,
    textBackgroundColor,
    allowInsertLinkText,
    defaultLinkTarget,
    extendAtomics,
    className,
    style,
    controlBarClassName,
    controlBarStyle,
    contentClassName,
    contentStyle,
    stripPastedStyles,
    componentBelowControlBar
  } = editorProps

  editorId = editorId || id
  hooks = buildHooks(hooks)
  controls = controls.filter((item) => !excludeControls.includes(item as any))
  language =
    (typeof language === 'function'
      ? language(languages, 'kedao')
      : languages[language]) || languages[defaultProps.language]

  const controlBarMedia: MediaProps = useMemo(() => {
    const defaultMedia = defaultProps.media
    const result = {
      ...defaultMedia,
      ...media,
      externalMedias: {
        ...defaultMedia.externals,
        ...media?.externals
      },
      accepts: {
        ...defaultMedia.accepts,
        ...media?.accepts
      }
    }

    if (!result.uploadFn) {
      result.video = false
      result.audio = false
    }
    return result
  }, [media])

  const callbackEditor = useMemo<CallbackEditor>(
    () => ({
      isFullscreen,
      editorState,
      setValue,
      getValue: () => editorState,
      requestFocus,
      editorProps: editorProps,
      lockOrUnlockEditor: setEditorLocked,
      finder,
      isLiving,
      tempColors,
      setTempColors: (tempColors, callback) => {
        setTempColors(tempColors)
        callback()
      },
      onChange: handleChange,
      setOnChange: (onChange) => {
        handleChange = onChange
      },
      convertOptions: convertOptions,
      blur: () => {
        draftInstanceRef.current?.blur()
      },
      readOnly: props.readOnly,
      forceRender,
      commands: {
        undo: () => {
          setValue(undo(editorState))
        },
        redo: () => {
          setValue(redo(editorState))
        },
        removeSelectionInlineStyles: () => {
          setValue(removeSelectionInlineStyles(editorState))
        },
        insertHorizontalLine: () => {
          setValue(insertHorizontalLine(editorState))
        },
        clearEditorContent: () => {
          setValue(clear(editorState), (editorState: EditorState) => {
            setValue(toggleSelectionIndent(editorState, 0))
          })
        },
        toggleFullscreen: () => {
          let newValue = null
          setIsFullscreen((v) => {
            newValue = !v
            return newValue
          })
          editorProps.onFullscreen?.(newValue)
        }
      }
    }),
    [
      isFullscreen,
      editorState,
      setValue,
      requestFocus,
      editorProps,
      setEditorLocked,
      finder,
      isLiving,
      tempColors,
      handleChange,
      convertOptions,
      draftInstanceRef.current,
      props.readOnly,
      forceRender,
      setIsFullscreen
    ]
  )

  const { unitExportFn } = convertOptions

  const commonProps = {
    editor: callbackEditor,
    editorId,
    hooks,
    editorState,
    containerNode: containerRef.current,
    imageControls,
    imageResizable,
    language,
    extendAtomics,
    imageEqualRatio
  }

  const blockRendererFn = getBlockRendererFn(
    commonProps,
    editorProps.blockRendererFn
  )
  const blockRenderMap = getBlockRenderMap(
    commonProps,
    editorProps.blockRenderMap
  )
  const blockStyleFn = getBlockStyleFn(editorProps.blockStyleFn)
  const customStyleMap = getCustomStyleMap(
    commonProps,
    editorProps.customStyleMap
  )
  const customStyleFn = getCustomStyleFn(commonProps, {
    fontFamilies,
    unitExportFn,
    customStyleFn: editorProps.customStyleFn
  })

  const keyBindingFn = getKeyBindingFn(editorProps.keyBindingFn)

  const mixedProps: any = {}

  if (
    editorLocked ||
    editorProps.disabled ||
    editorProps.readOnly ||
    editorProps.draftProps.readOnly
  ) {
    mixedProps.readOnly = true
  }

  if (
    placeholder &&
    fixPlaceholder &&
    !editorState.getCurrentContent().hasText() &&
    editorState.getCurrentContent().getFirstBlock().getType() !== 'unstyled'
  ) {
    placeholder = ''
  }

  const getContainerNode = useCallback(
    () => containerRef.current,
    [containerRef.current]
  )
  const controlBarColors = useMemo(
    () => [...colors, ...tempColors],
    [colors, tempColors]
  )
  const memoControls = useMemo(() => controls, [controls?.join(',')])

  return (
    <JotaiProvider>
      <div
        style={style}
        ref={containerRef}
        className={cls(mergeClassNames(
          'kedao-container',
          className,
          disabled && 'disabled',
          readOnly && 'read-only',
          isFullscreen && 'fullscreen'
        ))}
      >
        <ControlBar
          ref={controlBarInstanceRef}
          editorState={editorState}
          finder={finder}
          getContainerNode={getContainerNode}
          className={cls(controlBarClassName)}
          style={controlBarStyle}
          colors={controlBarColors}
          colorPicker={colorPicker}
          colorPickerAutoHide={colorPickerAutoHide}
          hooks={hooks}
          editorId={editorId}
          media={controlBarMedia}
          controls={memoControls}
          language={language as any}
          extendControls={extendControls}
          headings={headings}
          fontSizes={fontSizes}
          fontFamilies={fontFamilies}
          emojis={emojis}
          lineHeights={lineHeights}
          letterSpacings={letterSpacings}
          textAligns={textAligns}
          textBackgroundColor={textBackgroundColor}
          allowInsertLinkText={allowInsertLinkText}
          defaultLinkTarget={defaultLinkTarget}
          isFullscreen={isFullscreen}
          onChange={setValue}
          onRequestFocus={requestFocus}
          commands={callbackEditor.commands}
        />
        {componentBelowControlBar}
        <div
          onCompositionStart={handleCompositionStart}
          className={cls(`kedao-content ${contentClassName}`)}
          onCopy={handleCopyContent}
          style={contentStyle}
        >
          <Editor
            className={cls('editor-core')}
            ref={draftInstanceRef}
            editorState={editorState}
            handleKeyCommand={keyCommandHandlers}
            handleReturn={handleReturn}
            handleBeforeInput={handleBeforeInput}
            handleDrop={handleDrop}
            handleDroppedFiles={handleDroppedFiles}
            handlePastedText={handlePastedText}
            handlePastedFiles={handlePastedFiles}
            onChange={handleChange}
            onTab={onTab}
            onFocus={onFocus}
            onBlur={onBlur}
            blockRenderMap={blockRenderMap}
            blockRendererFn={blockRendererFn}
            blockStyleFn={blockStyleFn}
            customStyleMap={customStyleMap}
            customStyleFn={customStyleFn}
            keyBindingFn={keyBindingFn}
            placeholder={placeholder}
            stripPastedStyles={stripPastedStyles}
            {...editorProps.draftProps}
            {...mixedProps}
          />
        </div>
      </div>
    </JotaiProvider>
  )
};

(KedaoEditor as any).defaultProps = defaultProps
// KedaoEditor.use = useExtension
export default KedaoEditor

export { EditorState }
