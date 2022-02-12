import React from 'react'
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
  getPropInterceptors,
  useExtension
} from '../helpers/extension'
import ControlBar from '../components/business/ControlBar'

import 'draft-js/dist/Draft.css'
import '../assets/scss/_kedao.scss'
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
      content.toLocaleString().replace(/,/g, ''),
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

const getConvertOptions = ({
  _editorId: editorId,
  id,
  converts,
  fontFamilies
}): ConvertOptions => {
  const realEditorId = editorId || id
  const convertOptions = {
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

class KedaoEditor extends React.Component<KedaoEditorProps, any> {
  editorProps: any
  editorDecorators: any
  controlBarInstance: any
  isFocused: boolean
  isLiving: boolean
  finder: any
  valueInitialized: boolean
  containerNode: any
  draftInstance: any
  convertOptions: ConvertOptions

  static defaultProps = defaultProps
  static use = useExtension

  constructor (props) {
    super(props)

    this.editorProps = this.getEditorProps(props)
    this.editorDecorators = getDecorators(
      this.editorProps.editorId || this.editorProps.id
    )
    this.controlBarInstance = React.createRef()
    this.isFocused = false
    this.isLiving = false
    this.finder = null
    this.valueInitialized = !!(this.props.defaultValue || this.props.value)

    const defaultEditorState =
      (this.props.defaultValue || this.props.value) instanceof EditorState
        ? this.props.defaultValue || this.props.value
        : EditorState.createEmpty(this.editorDecorators)
    this.convertOptions = getConvertOptions(this.editorProps)

    let tempColors = []

    if (defaultEditorState instanceof EditorState) {
      const colors = ColorUtils.detectColorsFromDraftState(
        convertEditorStateToRaw(defaultEditorState)
      )
      tempColors = filterColors(colors, this.editorProps.colors)
    }

    this.state = {
      tempColors,
      editorState: defaultEditorState,
      isFullscreen: false
    }
    this.containerNode = null
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillMount () {
    if (isControlEnabled(this.editorProps, 'media')) {
      const { language, media } = this.editorProps
      const { uploadFn, validateFn, items }: any = {
        ...defaultProps.media,
        ...media
      }

      this.finder = new Finder({
        items,
        language,
        uploader: uploadFn,
        validator: validateFn
      })

      this.forceUpdate()
    }
  }

  componentDidMount () {
    this.isLiving = true
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps (props) {
    this.editorProps = this.getEditorProps(props)

    const { value: editorState } = props
    const { media, language } = this.editorProps
    const currentProps: KedaoEditorProps = this.getEditorProps()

    if (
      !isControlEnabled(currentProps, 'media') &&
      isControlEnabled(this.editorProps, 'media') &&
      !this.finder
    ) {
      const { uploadFn, validateFn, items }: any = {
        ...defaultProps.media,
        ...media
      }

      this.finder = new Finder({
        items,
        language,
        uploader: uploadFn,
        validator: validateFn
      })

      this.forceUpdate()
    }

    if (media?.items && this.finder) {
      this.finder.setItems(media.items)
    }

    let nextEditorState

    if (
      !this.valueInitialized &&
      typeof this.props.defaultValue === 'undefined' &&
      (props.defaultValue instanceof EditorState)
    ) {
      nextEditorState = props.defaultValue
    } else if (editorState instanceof EditorState) {
      nextEditorState = editorState
    }

    if (nextEditorState) {
      if (nextEditorState && nextEditorState !== this.state.editorState) {
        const tempColors = ColorUtils.detectColorsFromDraftState(
          convertEditorStateToRaw(nextEditorState)
        )
        this.convertOptions = getConvertOptions(this.editorProps)

        this.setState(
          prevState => ({
            tempColors: filterColors(
              [...prevState.tempColors, ...tempColors],
              currentProps.colors
            ),
            editorState: nextEditorState
          }),
          () => {
            if (this.props.onChange) {
              this.props.onChange(nextEditorState)
            }
          }
        )
      } else {
        this.setState({
          editorState: nextEditorState
        })
      }
    }
  }

  componentDidUpdate (_prevProps, prevState) {
    if (prevState.editorState !== this.state.editorState) {
      this.convertOptions = getConvertOptions(this.editorProps)
    }
  }

  componentWillUnmount () {
    this.isLiving = false
    if (this.controlBarInstance) {
      this.controlBarInstance.current?.closeFinder()
    }
  }

  getEditorProps (props = this.props) {
    const { value, defaultValue, onChange, ...restProps } = props // eslint-disable-line no-unused-vars
    const propInterceptors = getPropInterceptors(
      restProps.editorId || restProps.id
    )

    if (propInterceptors.length === 0) {
      return restProps
    }

    let propsMap = Map(restProps)

    propInterceptors.forEach(interceptor => {
      propsMap = propsMap.merge(Map(interceptor(propsMap.toJS(), this) || {}))
    })

    return propsMap.toJS()
  }

  onChange = (editorState: EditorState, callback?) => {
    let newEditorState = editorState
    if (!(editorState instanceof EditorState)) {
      newEditorState = EditorState.set(editorState, {
        decorator: this.editorDecorators
      })
    }

    if (!this.convertOptions) {
      this.convertOptions = getConvertOptions(this.editorProps)
    }

    this.setState({ editorState: newEditorState }, () => {
      this.props.onChange?.(newEditorState)
      callback?.(newEditorState)
    })
  }

  getDraftInstance = () => {
    return this.draftInstance
  }

  getFinderInstance = () => {
    return this.finder
  }

  getValue = () => {
    return this.state.editorState
  }

  setValue = (editorState: EditorState, callback?) => {
    return this.onChange(editorState, callback)
  }

  forceRender = () => {
    const selectionState = this.state.editorState.getSelection()

    this.setValue(
      EditorState.set(this.state.editorState, {
        decorator: this.editorDecorators
      }),
      () => {
        this.setValue(
          EditorState.forceSelection(
            this.state.editorState,
            selectionState
          )
        )
      }
    )
  }

  onTab = event => {
    if (
      keyCommandHandlers(
        'tab',
        this.state.editorState,
        this.getCallbackEditor()
      ) === 'handled'
    ) {
      event.preventDefault()
    }
    this.editorProps.onTab?.(event)
  }

  onFocus = () => {
    this.isFocused = true
    this.editorProps.onFocus?.(this.state.editorState)
  }

  onBlur = () => {
    this.isFocused = false
    this.editorProps.onBlur?.(this.state.editorState)
  }

  requestFocus = () => {
    setTimeout(() => this.draftInstance.focus(), 0)
  }

  handleKeyCommand = (command, editorState: EditorState) =>
    keyCommandHandlers(command, editorState, this.getCallbackEditor())

  handleReturn = (event, editorState: EditorState) =>
    returnHandlers(event, editorState, this.getCallbackEditor())

  handleBeforeInput = (chars, editorState: EditorState) =>
    beforeInputHandlers(chars, editorState, this.getCallbackEditor())

  handleDrop = (selectionState, dataTransfer) =>
    dropHandlers(selectionState, dataTransfer, this.getCallbackEditor())

  handleDroppedFiles = (selectionState, files) =>
    droppedFilesHandlers(selectionState, files, this.getCallbackEditor())

  handlePastedFiles = files =>
    pastedFilesHandlers(files, this.getCallbackEditor())

  handleCopyContent = event => copyHandlers(event, this.getCallbackEditor())

  handlePastedText = (text, html, editorState: EditorState) =>
    pastedTextHandlers(text, html, editorState, this.getCallbackEditor())

  handleCompositionStart = event =>
    compositionStartHandler(event, this.getCallbackEditor())

  undo = () => {
    this.setValue(ContentUtils.undo(this.state.editorState))
  }

  redo = () => {
    this.setValue(ContentUtils.redo(this.state.editorState))
  }

  removeSelectionInlineStyles = () => {
    this.setValue(
      ContentUtils.removeSelectionInlineStyles(this.state.editorState)
    )
  }

  insertHorizontalLine = () => {
    this.setValue(ContentUtils.insertHorizontalLine(this.state.editorState))
  }

  clearEditorContent = () => {
    this.setValue(ContentUtils.clear(this.state.editorState), (editorState: EditorState) => {
      this.setValue(ContentUtils.toggleSelectionIndent(editorState, 0))
    })
  }

  toggleFullscreen = fullscreen => {
    this.setState(
      prevState => ({
        isFullscreen:
          typeof fullscreen !== 'undefined'
            ? fullscreen
            : !prevState.isFullscreen
      }),
      () => {
        if (this.editorProps.onFullscreen) {
          this.editorProps.onFullscreen(this.state.isFullscreen)
        }
      }
    )
  }

  lockOrUnlockEditor = editorLocked => {
    this.setState({ editorLocked })
  }

  setEditorContainerNode = containerNode => {
    this.containerNode = containerNode
  }

  getCallbackEditor = () => {
    const callbackEditor: CallbackEditor = {
      isFullscreen: this.state.isFullscreen,
      editorState: this.state.editorState,
      setValue: this.setValue,
      getValue: this.getValue,
      requestFocus: this.requestFocus,
      editorProps: this.editorProps,
      lockOrUnlockEditor: this.lockOrUnlockEditor,
      finder: this.finder,
      isLiving: this.isLiving,
      tempColors: this.state.tempColors,
      setTempColors: (tempColors, callback) => {
        this.setState({ tempColors }, callback)
      },
      onChange: this.onChange,
      setOnChange: onChange => {
        this.onChange = onChange
      },
      convertOptions: this.convertOptions,
      blur: () => {
        this.draftInstance.blur()
      },
      readOnly: this.props.readOnly
    }
    return callbackEditor
  }

  render () {
    let {
      editorId,
      controls,
      media,
      language,
      hooks,
      placeholder
    } = this.editorProps
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
    } = this.editorProps

    const { isFullscreen, editorState } = this.state

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

    const callbackEditor = this.getCallbackEditor()

    const controlBarProps = {
      editor: callbackEditor,
      editorState,
      finder: this.finder,
      ref: this.controlBarInstance,
      getContainerNode: () => this.containerNode,
      className: controlBarClassName,
      style: controlBarStyle,
      colors: [...colors, ...this.state.tempColors],
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

    const { unitExportFn } = this.convertOptions

    const commonProps = {
      editor: callbackEditor,
      editorId,
      hooks,
      editorState,
      containerNode: this.containerNode,
      imageControls,
      imageResizable,
      language,
      extendAtomics,
      imageEqualRatio
    }

    const blockRendererFn = getBlockRendererFn(
      commonProps,
      this.editorProps.blockRendererFn
    )
    const blockRenderMap = getBlockRenderMap(
      commonProps,
      this.editorProps.blockRenderMap
    )
    const blockStyleFn = getBlockStyleFn(this.editorProps.blockStyleFn)
    const customStyleMap = getCustomStyleMap(
      commonProps,
      this.editorProps.customStyleMap
    )
    const customStyleFn = getCustomStyleFn(commonProps, {
      fontFamilies,
      unitExportFn,
      customStyleFn: this.editorProps.customStyleFn
    })

    const keyBindingFn = getKeyBindingFn(this.editorProps.keyBindingFn)

    const mixedProps: any = {}

    if (
      this.state.editorLocked ||
      this.editorProps.disabled ||
      this.editorProps.readOnly ||
      this.editorProps.draftProps.readOnly
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
      ref: instance => {
        this.draftInstance = instance
      },
      editorState,
      handleKeyCommand: this.handleKeyCommand,
      handleReturn: this.handleReturn,
      handleBeforeInput: this.handleBeforeInput,
      handleDrop: this.handleDrop,
      handleDroppedFiles: this.handleDroppedFiles,
      handlePastedText: this.handlePastedText,
      handlePastedFiles: this.handlePastedFiles,
      onChange: this.onChange,
      onTab: this.onTab,
      onFocus: this.onFocus,
      onBlur: this.onBlur,
      blockRenderMap,
      blockRendererFn,
      blockStyleFn,
      customStyleMap,
      customStyleFn,
      keyBindingFn,
      placeholder,
      stripPastedStyles,
      ...this.editorProps.draftProps,
      ...mixedProps
    }

    return (
      <div
        style={style}
        ref={this.setEditorContainerNode}
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
          onCompositionStart={this.handleCompositionStart}
          className={`bf-content ${contentClassName}`}
          onCopy={this.handleCopyContent}
          style={contentStyle}
        >
          <Editor {...draftProps} />
        </div>
      </div>
    )
  }
}

export default KedaoEditor

export { EditorState }
