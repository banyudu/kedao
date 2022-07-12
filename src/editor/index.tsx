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

const getConvertOptions = ({
  _editorId: editorId,
  id,
  converts,
  fontFamilies
}: {
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

    propInterceptors.forEach((interceptor) => {
      propsMap = propsMap.merge(Map(interceptor(propsMap.toJS(), this) || {}))
    })

    return propsMap.toJS() as any
  }

  const editorPropsRef = useRef<any>(getEditorProps())
  const editorDecoratorsRef = useRef(
    getDecorators(editorPropsRef.current.editorId || editorPropsRef.current.id)
  )
  const controlBarInstanceRef = useRef(null)
  const [isLiving, setIsLiving] = useState(false)
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

  const containerRef = useRef(null)

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
    setIsLiving(true)

    return () => {
      setIsLiving(false)
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
        convertOptionsRef.current = getConvertOptions(editorPropsRef.current)

        setTempColors((oldColors) =>
          filterColors([...oldColors, ...tempColors], currentProps.colors)
        )
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

    if (!convertOptionsRef.current) {
      convertOptionsRef.current = getConvertOptions(editorPropsRef.current)
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
      editorPropsRef.current.handleKeyCommand?.(
        command,
        editorState,
        callbackEditor
      ) === 'handled'
    ) {
      return 'handled'
    }

    if (command === 'kedao-save') {
      editorPropsRef.current.onSave?.(editorState)
      return 'handled'
    }

    const { controls, excludeControls } = editorPropsRef.current
    const allowIndent =
      (controls.indexOf('text-indent' as any) !== 0 ||
        controls.find((item) => item.key === 'text-indent')) &&
      !excludeControls.includes('text-indent')
    const cursorStart = editorState.getSelection().getStartOffset()
    const cursorEnd = editorState.getSelection().getEndOffset()
    const cursorIsAtFirst = cursorStart === 0 && cursorEnd === 0

    if (command === 'backspace') {
      if (
        editorPropsRef.current.onDelete &&
        !editorPropsRef.current.onDelete?.(editorState)
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
            ' '.repeat(editorPropsRef.current.codeTabIndents)
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
    editorPropsRef.current.onTab?.(event)
  }

  const onFocus = () => {
    editorPropsRef.current.onFocus?.(editorState)
  }

  const onBlur = () => {
    editorPropsRef.current.onBlur?.(editorState)
  }

  const requestFocus = () => {
    setTimeout(() => draftInstanceRef.current?.focus(), 0)
  }

  const handleReturn = (event, editorState: EditorState) => {
    if (
      editorPropsRef.current.handleReturn?.(
        event,
        editorState,
        callbackEditor
      ) === 'handled'
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
      editorPropsRef.current.handleBeforeInput?.(
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
    if (editorPropsRef.current.readOnly || editorPropsRef.current.disabled) {
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
      ...editorPropsRef.current.media
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
      editorPropsRef.current.handleDroppedFiles?.(
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
      editorPropsRef.current.handlePastedFiles?.(files, callbackEditor) ===
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

        const html = convertEditorStateToHTML(
          tempEditorState,
          convertOptionsRef.current
        )
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
      editorPropsRef.current.handlePastedText?.(
        text,
        html,
        editorState,
        callbackEditor
      ) === 'handled'
    ) {
      return 'handled'
    }

    if (!html || editorPropsRef.current.stripPastedStyles) {
      return false
    }

    const tempColors_ = ColorUtils.detectColorsFromHTMLString(html)

    setTempColors(
      [...tempColors, ...tempColors_]
        .filter((item) => !editorPropsRef.current.colors.includes(item))
        .filter((item, index, array) => array.indexOf(item) === index)
    )
    setValue(
      ContentUtils.insertHTML(
        editorState,
        convertOptionsRef.current,
        html,
        'paste'
      )
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

  let { editorId, controls, language, hooks, placeholder } =
    editorPropsRef.current
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
  } = editorPropsRef.current

  editorId = editorId || id
  hooks = buildHooks(hooks)
  controls = controls.filter((item) => excludeControls.indexOf(item) === -1)
  language =
    (typeof language === 'function'
      ? language(languages, 'kedao')
      : languages[language]) || languages[defaultProps.language]

  const controlBarMedia = useMemo(() => {
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
      editorProps: editorPropsRef.current,
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
      convertOptions: convertOptionsRef.current,
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
          editorPropsRef.current.onFullscreen?.(newValue)
        }
      }
    }),
    [
      isFullscreen,
      editorState,
      setValue,
      requestFocus,
      editorPropsRef.current,
      setEditorLocked,
      finderRef.current,
      isLiving,
      tempColors,
      handleChange,
      convertOptionsRef.current,
      draftInstanceRef.current,
      props.readOnly,
      forceRender,
      ContentUtils,
      setIsFullscreen
    ]
  )

  const { unitExportFn } = convertOptionsRef.current

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
          language={language}
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
            {...editorPropsRef.current.draftProps}
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
