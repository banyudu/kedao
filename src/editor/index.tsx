import React, {
  FC,
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback
} from 'react'
import Finder from '../finder'
import { ColorUtils, ContentUtils } from '../utils'
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
import ControlBar, { ControlBarProps } from '../components/business/ControlBar'

import 'draft-js/dist/Draft.css'
import '../assets/scss/kedao.scss'
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
import { handleNewLine } from 'draftjs-utils'

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
  controls?: ControlItem[]
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

  const currentEditorProps = useMemo(getEditorProps, [value, defaultValue])
  const editorDecoratorsRef = useRef(
    getDecorators(currentEditorProps.editorId || currentEditorProps.id)
  )
  const controlBarInstanceRef = useRef(null)
  const [isLiving, setIsLiving] = useState(false)
  const finderRef = useRef(null)
  const valueInitialized = !!(defaultValue || value)

  const defaultEditorState =
    (defaultValue || value) instanceof EditorState
      ? defaultValue || value
      : EditorState.createEmpty(editorDecoratorsRef.current)
  const getConvertOptions = (): ConvertOptions => {
    const { editorId, id, converts, fontFamilies } = currentEditorProps
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

  const convertOptions = useMemo(getConvertOptions, [currentEditorProps])

  let _tempColors: string[] = []

  if (defaultEditorState instanceof EditorState) {
    const colors = ColorUtils.detectColorsFromDraftState(
      convertEditorStateToRaw(defaultEditorState)
    )
    _tempColors = filterColors(colors, currentEditorProps.colors)
  }

  const [tempColors, setTempColors] = useState(_tempColors)
  const [editorState, setEditorState] = useState(defaultEditorState)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const [randomFlag, setRandomFlag] = useState(Math.random())

  const forceUpdate = () => setRandomFlag(Math.random())
  const finderInitFlag = useRef(false)

  const containerRef = useRef(null)

  // eslint-disable-next-line camelcase
  if (!finderInitFlag.current) {
    if (isControlEnabled(currentEditorProps, 'media')) {
      const { language, media } = currentEditorProps
      const { uploadFn, validateFn, items }: any = {
        ...defaultProps.media,
        ...media
      }

      finderRef.current = new Finder({
        items,
        language,
        uploader: uploadFn,
        validator: validateFn
      })

      forceUpdate()
    }
    finderInitFlag.current = true
  }

  useEffect(() => {
    setIsLiving(true)

    return () => {
      setIsLiving(false)
      controlBarInstanceRef.current?.closeFinder()
    }
  }, [])

  useEffect(() => {
    const editorState = value
    const { media, language } = currentEditorProps

    if (isControlEnabled(currentEditorProps, 'media') && !finderRef.current) {
      const { uploadFn, validateFn, items }: any = {
        ...defaultProps.media,
        ...media
      }

      finderRef.current = new Finder({
        items,
        language,
        uploader: uploadFn,
        validator: validateFn
      })

      forceUpdate()
    }

    if (media?.items && finderRef.current) {
      finderRef.current.setItems(media.items)
    }

    let nextEditorState

    if (!valueInitialized && defaultValue instanceof EditorState) {
      nextEditorState = props.defaultValue
    } else if (editorState instanceof EditorState) {
      nextEditorState = editorState
    }

    if (nextEditorState) {
      if (nextEditorState && nextEditorState !== editorState) {
        const tempColors = ColorUtils.detectColorsFromDraftState(
          convertEditorStateToRaw(nextEditorState)
        )

        setTempColors((oldColors) =>
          filterColors([...oldColors, ...tempColors], currentEditorProps.colors)
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
      currentEditorProps.handleKeyCommand?.(
        command,
        editorState,
        callbackEditor
      ) === 'handled'
    ) {
      return 'handled'
    }

    if (command === 'kedao-save') {
      currentEditorProps.onSave?.(editorState)
      return 'handled'
    }

    const { controls, excludeControls } = currentEditorProps
    const allowIndent =
      (controls.indexOf('text-indent' as any) !== 0 ||
        controls.find((item) => item.key === 'text-indent')) &&
      !excludeControls.includes('text-indent')
    const cursorStart = editorState.getSelection().getStartOffset()
    const cursorEnd = editorState.getSelection().getEndOffset()
    const cursorIsAtFirst = cursorStart === 0 && cursorEnd === 0

    if (command === 'backspace') {
      if (
        currentEditorProps.onDelete &&
        !currentEditorProps.onDelete?.(editorState)
      ) {
        return 'handled'
      }

      const blockType = ContentUtils.getSelectionBlockType(editorState)

      if (allowIndent && cursorIsAtFirst && blockType !== 'code-block') {
        setValue(ContentUtils.decreaseSelectionIndent(editorState))
      }
    }

    if (command === 'tab') {
      const blockType = ContentUtils.getSelectionBlockType(editorState)

      if (blockType === 'code-block') {
        setValue(
          ContentUtils.insertText(
            editorState,
            ' '.repeat(currentEditorProps.codeTabIndents)
          )
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
        setValue(ContentUtils.increaseSelectionIndent(editorState))
        return 'handled'
      }
    }

    const nextEditorState = ContentUtils.handleKeyCommand(editorState, command)

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
    currentEditorProps.onTab?.(event)
  }

  const onFocus = () => {
    currentEditorProps.onFocus?.(editorState)
  }

  const onBlur = () => {
    currentEditorProps.onBlur?.(editorState)
  }

  const requestFocus = () => {
    setTimeout(() => draftInstanceRef.current?.focus(), 0)
  }

  const handleReturn = (event, editorState: EditorState) => {
    if (
      currentEditorProps.handleReturn?.(event, editorState, callbackEditor) ===
      'handled'
    ) {
      return 'handled'
    }

    const currentBlock = ContentUtils.getSelectionBlock(editorState)
    const currentBlockType = currentBlock.getType()

    if (
      currentBlockType === 'unordered-list-item' ||
      currentBlockType === 'ordered-list-item'
    ) {
      if (currentBlock.getLength() === 0) {
        setValue(
          ContentUtils.toggleSelectionBlockType(editorState, 'unstyled')
        )
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
        setValue(
          ContentUtils.toggleSelectionBlockType(editorState, 'unstyled')
        )
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
      currentEditorProps.handleBeforeInput?.(
        chars,
        editorState,
        callbackEditor
      ) === 'handled'
    ) {
      return 'handled'
    }

    return 'not-handled'
  }

  const handleDrop = (selectionState, dataTransfer) => {
    if (currentEditorProps.readOnly || currentEditorProps.disabled) {
      return 'handled'
    }

    if (window?.__KEDAO_DRAGING__IMAGE__) {
      let nextEditorState: any = EditorState.forceSelection(
        editorState,
        selectionState
      )
      nextEditorState = ContentUtils.insertMedias(nextEditorState, [
        window.__KEDAO_DRAGING__IMAGE__.mediaData
      ])
      nextEditorState = ContentUtils.removeBlock(
        nextEditorState,
        window.__KEDAO_DRAGING__IMAGE__.block,
        nextEditorState.getSelection()
      )

      window.__KEDAO_DRAGING__IMAGE__ = null

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
      ...currentEditorProps.media
    }

    if (pasteImage) {
      files.slice(0, imagePasteLimit).forEach((file) => {
        if (file && file.type.indexOf('image') > -1 && finderRef.current) {
          const validateResult = validateFn ? validateFn(file) : true
          if (validateResult instanceof Promise) {
            validateResult
              .then(() => {
                finderRef.current.uploadImage(file, (image) => {
                  if (isLiving) {
                    setValue(ContentUtils.insertMedias(editorState, [image]))
                  }
                })
              })
              .catch(console.error)
          } else if (validateResult) {
            finderRef.current.uploadImage(file, (image) => {
              if (isLiving) {
                setValue(ContentUtils.insertMedias(editorState, [image]))
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
      currentEditorProps.handleDroppedFiles?.(
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
    if (
      currentEditorProps.handlePastedFiles?.(files, callbackEditor) ===
      'handled'
    ) {
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

  const handlePastedText = (text, html, editorState: EditorState) => {
    if (
      currentEditorProps.handlePastedText?.(
        text,
        html,
        editorState,
        callbackEditor
      ) === 'handled'
    ) {
      return 'handled'
    }

    if (!html || currentEditorProps.stripPastedStyles) {
      return false
    }

    const tempColors_ = ColorUtils.detectColorsFromHTMLString(html)

    setTempColors(
      [...tempColors, ...tempColors_]
        .filter((item) => !currentEditorProps.colors.includes(item))
        .filter((item, index, array) => array.indexOf(item) === index)
    )
    setValue(
      ContentUtils.insertHTML(editorState, convertOptions, html, 'paste')
    )
    return 'handled'
  }

  const handleCompositionStart = () => {
    const { editorState } = callbackEditor
    const selectedBlocks = ContentUtils.getSelectedBlocks(editorState)

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

  let { editorId, controls, language, hooks, placeholder } = currentEditorProps
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
  } = currentEditorProps

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
      editorProps: currentEditorProps,
      lockOrUnlockEditor: setEditorLocked,
      finder: finderRef.current,
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
          setValue(ContentUtils.undo(editorState))
        },
        redo: () => {
          setValue(ContentUtils.redo(editorState))
        },
        removeSelectionInlineStyles: () => {
          setValue(ContentUtils.removeSelectionInlineStyles(editorState))
        },
        insertHorizontalLine: () => {
          setValue(ContentUtils.insertHorizontalLine(editorState))
        },
        clearEditorContent: () => {
          setValue(
            ContentUtils.clear(editorState),
            (editorState: EditorState) => {
              setValue(ContentUtils.toggleSelectionIndent(editorState, 0))
            }
          )
        },
        toggleFullscreen: () => {
          let newValue = null
          setIsFullscreen((v) => {
            newValue = !v
            return newValue
          })
          currentEditorProps.onFullscreen?.(newValue)
        }
      }
    }),
    [
      isFullscreen,
      editorState,
      setValue,
      requestFocus,
      currentEditorProps,
      setEditorLocked,
      finderRef.current,
      isLiving,
      tempColors,
      handleChange,
      convertOptions,
      draftInstanceRef.current,
      props.readOnly,
      forceRender,
      ContentUtils,
      setIsFullscreen
    ]
  )

  const { unitExportFn } = convertOptions

  const commonProps = {
    editor: callbackEditor,
    editorId,
    hooks,
    editorState,
    containerNode: containerRef,
    imageControls,
    imageResizable,
    language,
    extendAtomics,
    imageEqualRatio
  }

  const blockRendererFn = getBlockRendererFn(
    commonProps,
    currentEditorProps.blockRendererFn
  )
  const blockRenderMap = getBlockRenderMap(
    commonProps,
    currentEditorProps.blockRenderMap
  )
  const blockStyleFn = getBlockStyleFn(currentEditorProps.blockStyleFn)
  const customStyleMap = getCustomStyleMap(
    commonProps,
    currentEditorProps.customStyleMap
  )
  const customStyleFn = getCustomStyleFn(commonProps, {
    fontFamilies,
    unitExportFn,
    customStyleFn: currentEditorProps.customStyleFn
  })

  const keyBindingFn = getKeyBindingFn(currentEditorProps.keyBindingFn)

  const mixedProps: any = {}

  if (
    editorLocked ||
    currentEditorProps.disabled ||
    currentEditorProps.readOnly ||
    currentEditorProps.draftProps.readOnly
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
    <div
      key={randomFlag}
      style={style}
      ref={containerRef}
      className={mergeClassNames(
        'bf-container',
        className,
        disabled && 'disabled',
        readOnly && 'read-only',
        isFullscreen && 'fullscreen'
      )}
    >
      <ControlBar
        ref={controlBarInstanceRef}
        editorState={editorState}
        finder={finderRef.current}
        getContainerNode={getContainerNode}
        className={controlBarClassName}
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
        className={`bf-content ${contentClassName}`}
        onCopy={handleCopyContent}
        style={contentStyle}
      >
        <Editor
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
          {...currentEditorProps.draftProps}
          {...mixedProps}
        />
      </div>
    </div>
  )
};

(KedaoEditor as any).defaultProps = defaultProps
// KedaoEditor.use = useExtension
export default KedaoEditor

export { EditorState }
