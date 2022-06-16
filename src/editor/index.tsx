import React, { FC, useEffect, useState, useRef } from 'react'
import Finder from '../finder'
import { ColorUtils, ContentUtils } from '../utils'
import { Editor, EditorProps, EditorState } from 'draft-js'
import { Map } from 'immutable'
import mergeClassNames from 'merge-class-names'

import languages from '../languages'
import getKeyBindingFn from '../configs/keybindings'
import defaultProps from '../configs/props'
import {
  keyCommandHandlers,
  returnHandlers,
  beforeInputHandlers,
  dropHandlers,
  droppedFilesHandlers,
  copyHandlers,
  pastedFilesHandlers,
  pastedTextHandlers,
  compositionStartHandler
} from '../configs/handlers'
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
import ControlBar from '../components/business/ControlBar'

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
  Hooks,
  ImageControlItem,
  ConvertOptions
} from '../types'
import {
  convertEditorStateToRaw,
  convertRawToEditorState,
  convertHTMLToEditorState
} from '../convert'

export const createStateFromContent = (content, options: ConvertOptions = {}) => {
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
  }
  if (typeof content === 'number') {
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
}

const buildHooks = hooks => (hookName, defaultReturns = {}) => {
  return hooks[hookName] || (() => defaultReturns)
}

const filterColors = (colors: string[], colors2: string[]) => {
  return colors
    .filter(item => {
      return !colors2.find(color => color.toLowerCase() === item.toLowerCase())
    })
    .filter((item, index, array) => array.indexOf(item) === index)
}

const isControlEnabled = (
  { controls = [], extendControls = [], excludeControls = [] },
  controlName: string
) => {
  return (
    [...controls, ...extendControls].find(
      item => item === controlName || item.key === controlName
    ) && !excludeControls.includes(controlName)
  )
}

const getConvertOptions = ({ _editorId: editorId, id, converts, fontFamilies }: {
  _editorId: string
  id: string
  converts: Partial<ConvertOptions>
  fontFamilies: ConvertOptions['fontFamilies']
}): ConvertOptions => {
  const realEditorId = editorId || id
  const convertOptions: ConvertOptions = {
    ...defaultProps.converts,
    ...converts,
    fontFamilies: fontFamilies
  }

  convertOptions.styleImportFn = compositeStyleImportFn(
    convertOptions.styleImportFn,
    realEditorId
  )
  convertOptions.styleExportFn = compositeStyleExportFn(
    convertOptions.styleExportFn,
    realEditorId
  )
  convertOptions.entityImportFn = compositeEntityImportFn(
    convertOptions.entityImportFn,
    realEditorId
  )
  convertOptions.entityExportFn = compositeEntityExportFn(
    convertOptions.entityExportFn,
    realEditorId
  )
  convertOptions.blockImportFn = compositeBlockImportFn(
    convertOptions.blockImportFn,
    realEditorId
  )
  convertOptions.blockExportFn = compositeBlockExportFn(
    convertOptions.blockExportFn,
    realEditorId
  )

  return convertOptions
}

const KedaoEditor: FC<KedaoEditorProps> = (props) => {
  const { defaultValue, value, onChange } = props
  const draftInstanceRef = useRef(null)
  const [editorLocked, setEditorLocked] = useState(null)

  const getEditorProps = (): EditorProps => {
    const { value, defaultValue, onChange, ...restProps } = props // eslint-disable-line no-unused-vars
    const propInterceptors = getPropInterceptors(
      restProps.editorId || restProps.id
    )

    if (propInterceptors.length === 0) {
      return restProps as any
    }

    let propsMap = Map(restProps)

    propInterceptors.forEach(interceptor => {
      propsMap = propsMap.merge(Map(interceptor(propsMap.toJS(), this) || {}))
    })

    return propsMap.toJS() as any
  }

  const editorPropsRef = useRef<any>(getEditorProps())
  const editorDecoratorsRef = useRef(getDecorators(
    editorPropsRef.current.editorId || editorPropsRef.current.id
  ))
  const controlBarInstanceRef = useRef(null)
  const isFocusedRef = useRef(false)
  const isLivingRef = useRef(false)
  const finderRef = useRef(null)
  const valueInitialized = !!(defaultValue || value)

  const defaultEditorState =
    (defaultValue || value) instanceof EditorState
      ? defaultValue || value
      : EditorState.createEmpty(editorDecoratorsRef.current)
  const convertOptionsRef = useRef(getConvertOptions(editorPropsRef.current))

  let _tempColors: string[] = []

  if (defaultEditorState instanceof EditorState) {
    const colors = ColorUtils.detectColorsFromDraftState(
      convertEditorStateToRaw(defaultEditorState)
    )
    _tempColors = filterColors(colors, editorPropsRef.current.colors)
  }

  const [tempColors, setTempColors] = useState(_tempColors)
  const [editorState, setEditorState] = useState(defaultEditorState)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const [randomFlag, setRandomFlag] = useState(Math.random())

  const forceUpdate = () => setRandomFlag(Math.random())
  const finderInitFlag = useRef(false)

  const containerNodeRef = useRef(null)

  // eslint-disable-next-line camelcase
  if (!finderInitFlag.current) {
    if (isControlEnabled(editorPropsRef.current, 'media')) {
      const { language, media } = editorPropsRef.current
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
    isLivingRef.current = true

    return () => {
      isLivingRef.current = false
      controlBarInstanceRef.current?.closeFinder()
    }
  }, [])

  useEffect(() => {
    const editorState = value
    const { media, language } = editorPropsRef.current
    const currentProps: KedaoEditorProps = getEditorProps()

    if (
      !isControlEnabled(currentProps, 'media') &&
      isControlEnabled(editorPropsRef.current, 'media') &&
      !finderRef.current
    ) {
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

    if (!valueInitialized && (defaultValue instanceof EditorState)) {
      nextEditorState = props.defaultValue
    } else if (editorState instanceof EditorState) {
      nextEditorState = editorState
    }

    if (nextEditorState) {
      if (nextEditorState && nextEditorState !== editorState) {
        const tempColors = ColorUtils.detectColorsFromDraftState(
          convertEditorStateToRaw(nextEditorState)
        )
        convertOptionsRef.current = getConvertOptions(editorPropsRef.current)

        setTempColors(oldColors => filterColors(
          [...oldColors, ...tempColors],
          currentProps.colors
        ))
        setEditorState(nextEditorState)
        onChange?.(nextEditorState)
      } else {
        setEditorState(nextEditorState)
      }
    }
    editorPropsRef.current = currentProps
  }, [defaultValue, value])

  useEffect(() => {
    convertOptionsRef.current = getConvertOptions(editorPropsRef.current)
  }, [editorState])

  let handleChange = (editorState: EditorState, callback?: Function) => {
    let newEditorState = editorState
    if (!(editorState instanceof EditorState)) {
      newEditorState = EditorState.set(editorState, {
        decorator: editorDecoratorsRef.current
      })
    }

    if (!convertOptionsRef.current) {
      convertOptionsRef.current = getConvertOptions(editorPropsRef.current)
    }

    setEditorState(newEditorState)
    onChange?.(newEditorState)
    callback?.(newEditorState)
  }

  const getValue = () => {
    return editorState
  }

  const setValue = (editorState: EditorState, callback?: Function) => {
    return handleChange(editorState, callback)
  }

  const forceRender = () => {
    const selectionState = editorState.getSelection()

    setValue(
      EditorState.set(editorState, {
        decorator: editorDecoratorsRef.current
      }),
      () => {
        setValue(
          EditorState.forceSelection(
            editorState,
            selectionState
          )
        )
      }
    )
  }

  const onTab = event => {
    if (
      keyCommandHandlers(
        'tab',
        editorState,
        getCallbackEditor()
      ) === 'handled'
    ) {
      event.preventDefault()
    }
    editorPropsRef.current.onTab?.(event)
  }

  const onFocus = () => {
    isFocusedRef.current = true
    editorPropsRef.current.onFocus?.(editorState)
  }

  const onBlur = () => {
    isFocusedRef.current = false
    editorPropsRef.current.onBlur?.(editorState)
  }

  const requestFocus = () => {
    setTimeout(() => draftInstanceRef.current?.focus(), 0)
  }

  const handleKeyCommand = (command: string, editorState: EditorState) =>
    keyCommandHandlers(command, editorState, getCallbackEditor())

  const handleReturn = (event, editorState: EditorState) =>
    returnHandlers(event, editorState, getCallbackEditor())

  const handleBeforeInput = (chars, editorState: EditorState) =>
    beforeInputHandlers(chars, editorState, getCallbackEditor())

  const handleDrop = (selectionState, dataTransfer) =>
    dropHandlers(selectionState, dataTransfer, getCallbackEditor())

  const handleDroppedFiles = (selectionState, files) =>
    droppedFilesHandlers(selectionState, files, getCallbackEditor())

  const handlePastedFiles = files =>
    pastedFilesHandlers(files, getCallbackEditor())

  const handleCopyContent = event => copyHandlers(event, getCallbackEditor())

  const handlePastedText = (text, html, editorState: EditorState) =>
    pastedTextHandlers(text, html, editorState, getCallbackEditor())

  const handleCompositionStart = event =>
    compositionStartHandler(event, getCallbackEditor())

  const undo = () => {
    setValue(ContentUtils.undo(editorState))
  }

  const redo = () => {
    setValue(ContentUtils.redo(editorState))
  }

  const removeSelectionInlineStyles = () => {
    setValue(
      ContentUtils.removeSelectionInlineStyles(editorState)
    )
  }

  const insertHorizontalLine = () => {
    setValue(ContentUtils.insertHorizontalLine(editorState))
  }

  const clearEditorContent = () => {
    setValue(ContentUtils.clear(editorState), (editorState: EditorState) => {
      setValue(ContentUtils.toggleSelectionIndent(editorState, 0))
    })
  }

  const toggleFullscreen = () => {
    let newValue = null
    setIsFullscreen(v => {
      newValue = !v
      return newValue
    })
    editorPropsRef.current.onFullscreen?.(newValue)
  }

  const lockOrUnlockEditor = editorLocked => {
    setEditorLocked(editorLocked)
  }

  const getCallbackEditor = () => {
    const callbackEditor: CallbackEditor = {
      isFullscreen: isFullscreen,
      editorState: editorState,
      setValue,
      getValue,
      requestFocus,
      editorProps: editorPropsRef.current,
      lockOrUnlockEditor,
      finder: finderRef.current,
      isLiving: isLivingRef.current,
      tempColors,
      setTempColors: (tempColors, callback) => {
        setTempColors(tempColors)
        callback()
      },
      onChange: handleChange,
      setOnChange: onChange => {
        handleChange = onChange
      },
      convertOptions: convertOptionsRef.current,
      blur: () => {
        draftInstanceRef.current?.blur()
      },
      readOnly: props.readOnly,
      forceRender,
      commands: {
        undo,
        redo,
        removeSelectionInlineStyles,
        insertHorizontalLine,
        clearEditorContent,
        toggleFullscreen
      }
    }
    return callbackEditor
  }

  let {
    editorId,
    controls,
    media,
    language,
    hooks,
    placeholder
  } = editorPropsRef.current
  const {
    id,
    excludeControls,
    extendControls,
    readOnly,
    disabled,
    colors,
    colorPicker,
    colorPickerTheme,
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
  } = editorPropsRef.current

  editorId = editorId || id
  hooks = buildHooks(hooks)
  controls = controls.filter(item => excludeControls.indexOf(item) === -1)
  language =
      (typeof language === 'function'
        ? language(languages, 'kedao')
        : languages[language]) || languages[defaultProps.language]

  const externalMedias = {
    ...defaultProps.media.externals,
    ...media?.externals
  }

  const accepts = {
    ...defaultProps.media.accepts,
    ...media?.accepts
  }

  media = { ...defaultProps.media, ...media, externalMedias, accepts }

  if (!media.uploadFn) {
    media.video = false
    media.audio = false
  }

  const callbackEditor = getCallbackEditor()

  const controlBarProps = {
    editor: callbackEditor,
    editorState,
    finder: finderRef.current,
    ref: controlBarInstanceRef,
    getContainerNode: () => containerNodeRef.current,
    className: controlBarClassName,
    style: controlBarStyle,
    colors: [...colors, ...tempColors],
    colorPicker,
    colorPickerTheme,
    colorPickerAutoHide,
    hooks,
    editorId,
    media,
    controls,
    language,
    extendControls,
    headings,
    fontSizes,
    fontFamilies,
    emojis,
    lineHeights,
    letterSpacings,
    textAligns,
    textBackgroundColor,
    allowInsertLinkText,
    defaultLinkTarget
  }

  const { unitExportFn } = convertOptionsRef.current

  const commonProps = {
    editor: callbackEditor,
    editorId,
    hooks,
    editorState,
    containerNode: containerNodeRef,
    imageControls,
    imageResizable,
    language,
    extendAtomics,
    imageEqualRatio
  }

  const blockRendererFn = getBlockRendererFn(
    commonProps,
    editorPropsRef.current.blockRendererFn
  )
  const blockRenderMap = getBlockRenderMap(
    commonProps,
    editorPropsRef.current.blockRenderMap
  )
  const blockStyleFn = getBlockStyleFn(editorPropsRef.current.blockStyleFn)
  const customStyleMap = getCustomStyleMap(
    commonProps,
    editorPropsRef.current.customStyleMap
  )
  const customStyleFn = getCustomStyleFn(commonProps, {
    fontFamilies,
    unitExportFn,
    customStyleFn: editorPropsRef.current.customStyleFn
  })

  const keyBindingFn = getKeyBindingFn(editorPropsRef.current.keyBindingFn)

  const mixedProps: any = {}

  if (
    editorLocked ||
      editorPropsRef.current.disabled ||
      editorPropsRef.current.readOnly ||
      editorPropsRef.current.draftProps.readOnly
  ) {
    mixedProps.readOnly = true
  }

  if (
    placeholder &&
      fixPlaceholder &&
      !editorState.getCurrentContent().hasText() &&
      editorState
        .getCurrentContent()
        .getFirstBlock()
        .getType() !== 'unstyled'
  ) {
    placeholder = ''
  }

  const draftProps = {
    ref: draftInstanceRef,
    editorState,
    handleKeyCommand,
    handleReturn,
    handleBeforeInput,
    handleDrop,
    handleDroppedFiles,
    handlePastedText,
    handlePastedFiles,
    onChange: handleChange,
    onTab,
    onFocus,
    onBlur,
    blockRenderMap,
    blockRendererFn,
    blockStyleFn,
    customStyleMap,
    customStyleFn,
    keyBindingFn,
    placeholder,
    stripPastedStyles,
    ...editorPropsRef.current.draftProps,
    ...mixedProps
  }

  return (
    <div
      key={randomFlag}
      style={style}
      ref={containerNodeRef}
      className={mergeClassNames(
        'bf-container',
        className,
        disabled && 'disabled',
        readOnly && 'read-only',
        isFullscreen && 'fullscreen'
      )}
    >
      <ControlBar {...controlBarProps} />
      {componentBelowControlBar}
      <div
        onCompositionStart={handleCompositionStart}
        className={`bf-content ${contentClassName}`}
        onCopy={handleCopyContent}
        style={contentStyle}
      >
        <Editor {...draftProps} />
      </div>
    </div>
  )
}

(KedaoEditor as any).defaultProps = defaultProps
// KedaoEditor.use = useExtension
export default KedaoEditor

export { EditorState }
