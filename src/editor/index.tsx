import { classNameParser } from '../utils/style'
import React, {
  FC,
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback
} from 'react'
import {
  toggleSelectionIndent,
  insertHorizontalLine,
  undo,
  redo,
  insertHTML,
  increaseSelectionIndent,
  getSelectedBlocks,
  insertMedias,
  removeBlock,
  getSelectionBlock,
  removeSelectionInlineStyles,
  getSelectionBlockType,
  decreaseSelectionIndent,
  toggleSelectionBlockType,
  insertText,
  handleNewLine,
  handleKeyCommand as defaultHandleKeyCommand,
  clear,
  convertRawToEditorState,
  convertHTMLToEditorState,
  convertEditorStateToHTML
} from '../utils'
import {
  Editor,
  RichUtils,
  Modifier,
  EditorState,
  getDefaultKeyBinding,
  KeyBindingUtil,
  ContentState,
  DraftHandleValue
} from 'draft-js'
import mergeClassNames from 'merge-class-names'
import { Provider as JotaiProvider, useSetAtom } from 'jotai'

import {
  getBlockRendererFn,
  getBlockRenderMap,
  getBlockStyleFn,
  getCustomStyleMap,
  getCustomStyleFn,
  getDecorators
} from '../utils/renderers'

import ControlBar from '../components/ControlBar'

import 'draft-js/dist/Draft.css'
import styles from './style.module.scss'
import {
  MediaProps,
  ConvertOptions,
  BlockRendererFn,
  KedaoEditorProps,
  SupportedLangs,
  Language,
  EditorMode
} from '../types'

import getFragmentFromSelection from 'draft-js/lib/getFragmentFromSelection'
import {
  defaultControls,
  defaultFontFamilies,
  defaultImageControls
} from '../constants'
import { langAtom } from '../states'

const cls = classNameParser(styles)

const langLoaders: Record<SupportedLangs, () => Promise<Language>> = {
  en: async () => (await import('../i18n/en')).default,
  jpn: async () => (await import('../i18n/jpn')).default,
  kr: async () => (await import('../i18n/kr')).default,
  pl: async () => (await import('../i18n/pl')).default,
  ru: async () => (await import('../i18n/ru')).default,
  tr: async () => (await import('../i18n/tr')).default,
  'zh-hant': async () => (await import('../i18n/zh-hant')).default,
  zh: async () => (await import('../i18n/zh')).default
}

const defaultMedia: any = {
  pasteImage: true,
  imagePasteLimit: 5,
  image: true,
  video: true,
  audio: true,
  uploadFn: null,
  validateFn: null,
  onBeforeDeselect: null,
  onDeselect: null,
  onBeforeSelect: null,
  onSelect: null,
  onBeforeRemove: null,
  onRemove: null,
  onCancel: null,
  onFileSelect: null,
  onBeforeInsert: null,
  onInsert: null,
  onChange: null,
  accepts: {
    image: 'image/png,image/jpeg,image/gif,image/webp,image/apng,image/svg',
    video: 'video/mp4',
    audio: 'audio/mp3'
  },
  externals: {
    audio: true,
    video: true,
    image: true,
    embed: true
  }
}

const unitExportFn = (value, type: string) =>
  type === 'line-height' ? value : `${value}px`

export const createStateFromContent = (
  content,
  options: ConvertOptions = {}
) => {
  const customOptions: ConvertOptions = { ...options }
  customOptions.unitExportFn = customOptions.unitExportFn || unitExportFn

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
    editorState = convertRawToEditorState(content, getDecorators())
  }
  if (typeof content === 'string') {
    try {
      if (/^(-)?\d+$/.test(content)) {
        editorState = convertHTMLToEditorState(
          content,
          getDecorators(),
          customOptions,
          'create'
        )
      } else {
        editorState = createStateFromContent(JSON.parse(content), customOptions)
      }
    } catch (error) {
      editorState = convertHTMLToEditorState(
        content,
        getDecorators(),
        customOptions,
        'create'
      )
    }
  } else if (typeof content === 'number') {
    editorState = convertHTMLToEditorState(
      Number(content)
        .toLocaleString()
        .replace(/,/g, ''),
      getDecorators(),
      customOptions,
      'create'
    )
  } else {
    editorState = EditorState.createEmpty(getDecorators())
  }

  return editorState
}

const defaultExtendControls = []
const defaultExtendAtomics = []
const defaultExcludeControls = []
const defaultConverts = { unitExportFn }

const KedaoEditor: FC<KedaoEditorProps> = ({
  controls = defaultControls as any,
  language: locale = 'zh',
  excludeControls = defaultExcludeControls,
  handlePastedText,
  extendControls = defaultExtendControls,
  extendAtomics = defaultExtendAtomics,
  componentBelowControlBar = null,
  media = defaultMedia,
  imageControls = defaultImageControls,
  imageResizable = true,
  imageEqualRatio = true,
  codeTabIndents = 2,
  textBackgroundColor = true,
  allowInsertLinkText = false,
  converts = defaultConverts,
  stripPastedStyles = false,
  className = '',
  handleKeyCommand,
  onSave,
  onBlur,
  onDelete,
  onFocus,
  handleReturn,
  handleBeforeInput,
  handleDroppedFiles,
  blockStyleFn,
  blockRendererFn,
  customStyleMap,
  handlePastedFiles,
  blockRenderMap,
  customStyleFn,
  onFullscreen,
  placeholder,
  readOnly,
  disabled,
  style,
  controlBarClassName = '',
  controlBarStyle,
  contentClassName = '',
  contentStyle,
  defaultValue,
  value,
  editorId,
  keyBindingFn,
  id,
  onChange,
  fixPlaceholder = false
}: KedaoEditorProps) => {
  const draftInstanceRef = useRef(null)
  const [editorLocked, setEditorLocked] = useState(null)

  const editorDecoratorsRef = useRef(getDecorators())
  const controlBarInstanceRef = useRef(null)
  const [isLiving, setIsLiving] = useState(false)

  const setLanuage = useSetAtom(langAtom)

  const [mode, setMode] = useState<EditorMode>('richtext')
  const [html, setHtml] = useState('')

  const defaultEditorState = useMemo(() =>
    (defaultValue || value) instanceof EditorState
      ? defaultValue || value
      : EditorState.createEmpty(editorDecoratorsRef.current), [])

  const [editorState, setEditorState] = useState(defaultEditorState)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const setupLang = async () => {
      const loader = langLoaders[locale]
      if (loader) {
        try {
          const language = await loader()
          setLanuage(language)
        } catch (error) {
          console.error(error)
        }
      }
    }

    setupLang().catch(console.error)
  }, [locale])

  const getConvertOptions = (): ConvertOptions => {
    const result: ConvertOptions = {
      unitExportFn,
      ...converts,
      fontFamilies: defaultFontFamilies
    }

    return result
  }

  const convertOptions = useMemo(getConvertOptions, [editorId, id, converts])

  useEffect(() => {
    if (isLiving) {
      setEditorState(value)
    }
  }, [value])

  useEffect(() => {
    setIsLiving(true)

    return () => {
      setIsLiving(false)
    }
  }, [])

  const handleChange = useCallback((
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
  }, [editorDecoratorsRef.current, onChange])

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

  const keyCommandHandlers = useCallback((command: string, editorState: EditorState) => {
    if (handleKeyCommand?.(command, editorState) === 'handled') {
      return 'handled'
    }

    if (command === 'kedao-save') {
      onSave?.(editorState)
      return 'handled'
    }

    const allowIndent =
      controls.some(ctrl => {
        return typeof ctrl === 'string'
          ? ctrl === 'text-indent'
          : ctrl.type === 'text-indent'
      }) && !excludeControls.includes('text-indent')

    const cursorStart = editorState.getSelection().getStartOffset()
    const cursorEnd = editorState.getSelection().getEndOffset()
    const cursorIsAtFirst = cursorStart === 0 && cursorEnd === 0

    if (command === 'backspace') {
      if (onDelete && !onDelete?.(editorState)) {
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
        setValue(insertText(editorState, ' '.repeat(codeTabIndents)))
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

    const nextEditorState = defaultHandleKeyCommand(editorState, command)

    if (nextEditorState) {
      setValue(nextEditorState)
      return 'handled'
    }

    return 'not-handled'
  }, [setValue, handleKeyCommand, onSave, onDelete, controls, excludeControls, codeTabIndents])

  const handleFocus = useCallback(() => {
    onFocus?.(editorState)
  }, [onFocus])

  const handleBlur = useCallback(() => {
    onBlur?.(editorState)
  }, [onBlur])

  const requestFocus = useCallback(() => {
    setTimeout(() => draftInstanceRef.current?.focus(), 0)
  }, [draftInstanceRef.current])

  const handleReturn_ = useCallback((event, editorState: EditorState) => {
    if (handleReturn?.(event, editorState) === 'handled') {
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
  }, [setValue, handleReturn, handleNewLine])

  const handleBeforeInput_ = useCallback((chars, editorState: EditorState) => {
    if (handleBeforeInput?.(chars, editorState) === 'handled') {
      return 'handled'
    }

    return 'not-handled'
  }, [])

  const handleDrop = useCallback((selectionState, dataTransfer) => {
    if (readOnly || disabled) {
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
      )
      ;(window as any).__KEDAO_DRAGING__IMAGE__ = null

      setEditorLocked(true)
      setValue(nextEditorState)

      return 'handled'
    }
    if (!dataTransfer || !dataTransfer.getText()) {
      return 'handled'
    }

    return 'not-handled'
  }, [])

  const handleFiles = useCallback(files => {
    const { pasteImage, validateFn, imagePasteLimit }: any = {
      ...defaultMedia,
      ...media
    }

    const upload = file => {
      controlBarInstanceRef.current?.uploadImage(file, image => {
        if (isLiving) {
          setValue(insertMedias(editorState, [image]))
        }
      })
    }

    if (pasteImage) {
      files.slice(0, imagePasteLimit).forEach(file => {
        if (
          file &&
          file.type.indexOf('image') > -1 &&
          controlBarInstanceRef.current
        ) {
          const validateResult = validateFn ? validateFn(file) : true
          if (validateResult instanceof Promise) {
            validateResult
              .then(() => {
                upload(file)
              })
              .catch(console.error)
          } else if (validateResult) {
            upload(file)
          }
        }
      })
    }

    if (files[0] && files[0].type.indexOf('image') > -1 && pasteImage) {
      return 'handled'
    }

    return 'not-handled'
  }, [!!controlBarInstanceRef.current, media, controlBarInstanceRef.current?.uploadImage])

  const handleDroppedFiles_ = useCallback((selectionState, files) => {
    if (handleDroppedFiles?.(selectionState, files) === 'handled') {
      return 'handled'
    }

    return handleFiles(files)
  }, [handleFiles, handleDroppedFiles])

  const handlePastedFiles_ = useCallback(files => {
    if (handlePastedFiles?.(files) === 'handled') {
      return 'handled'
    }

    return handleFiles(files)
  }, [handleFiles, handlePastedFiles])

  const handleCopyContent = event => {
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

  const handlePastedText_ = useCallback((
    text: string,
    html: string,
    editorState: EditorState
  ): DraftHandleValue => {
    if (handlePastedText?.(text, html, editorState) === 'handled') {
      return 'handled'
    }

    if (!html || stripPastedStyles) {
      return 'not-handled'
    }

    setValue(insertHTML(editorState, convertOptions, html, 'paste'))
    return 'handled'
  }, [stripPastedStyles, setValue])

  const handleCompositionStart = () => {
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

  editorId = editorId || id
  controls = controls.filter(item => !excludeControls.includes(item as any))

  const controlBarMedia: MediaProps = useMemo(() => {
    const result: MediaProps = {
      ...defaultMedia,
      ...media,
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

  const commands = useMemo(() => ({
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
      setIsFullscreen(v => {
        newValue = !v
        return newValue
      })
      onFullscreen?.(newValue)
    },
    toggleHtml: () => {
      setMode(oldMode => oldMode === 'html' ? 'richtext' : 'html')
      setHtml(convertEditorStateToHTML(editorState))
    }
  }), [onFullscreen, editorState])

  const getContainerNode = useCallback(() => containerRef.current, [
    containerRef.current
  ])

  const blockRendererFn_: BlockRendererFn = getBlockRendererFn(
    {
      value: editorState,
      onChange: setValue,
      readOnly: readOnly || disabled,
      imageControls,
      imageResizable,
      imageEqualRatio,
      getContainerNode,
      refresh: () => forceRender(),
      lock: setEditorLocked,
      extendAtomics,
      editorId
    },
    blockRendererFn
  )
  const blockRenderMap_ = useMemo(() => getBlockRenderMap(blockRenderMap), [blockRenderMap])
  const blockStyleFn_ = useMemo(() => getBlockStyleFn(blockStyleFn), [blockStyleFn])
  const customStyleMap_ = useMemo(() => getCustomStyleMap(customStyleMap), [customStyleMap])
  const customStyleFn_ = useMemo(() => getCustomStyleFn({
    fontFamilies: defaultFontFamilies,
    unitExportFn,
    customStyleFn: customStyleFn
  }), [customStyleFn])

  const keyBindingFn_ = useCallback(event => {
    if (
      event.keyCode === 83 &&
      (KeyBindingUtil.hasCommandModifier(event) ||
        KeyBindingUtil.isCtrlKeyCommand(event))
    ) {
      return 'kedao-save'
    }

    if (keyBindingFn) {
      return keyBindingFn(event) || getDefaultKeyBinding(event)
    }

    return getDefaultKeyBinding(event)
  }, [keyBindingFn])

  const mixedProps: any = {}

  if (editorLocked || disabled || readOnly) {
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

  const memoControls = useMemo(() => controls, [controls?.join(',')])

  const renderEditor = () => {
    if (mode === 'html') {
      return (
        <div
          className={cls('kedao-html-container')}
        >
          <textarea
            value={html}
            readOnly
            className={cls('kedao-html')}
          />
        </div>
      )
    }

    return (
      <Editor
        ref={draftInstanceRef}
        editorState={editorState}
        handleKeyCommand={keyCommandHandlers}
        handleReturn={handleReturn_}
        handleBeforeInput={handleBeforeInput_}
        handleDrop={handleDrop}
        handleDroppedFiles={handleDroppedFiles_}
        handlePastedText={handlePastedText_}
        handlePastedFiles={handlePastedFiles_}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        blockRenderMap={blockRenderMap_}
        blockRendererFn={blockRendererFn_ as any}
        blockStyleFn={blockStyleFn_}
        customStyleMap={customStyleMap_}
        customStyleFn={customStyleFn_}
        keyBindingFn={keyBindingFn_}
        placeholder={placeholder}
        stripPastedStyles={stripPastedStyles}
        readOnly={editorLocked || disabled || readOnly}
      />
    )
  }

  return (
    <div
      style={style}
      ref={containerRef}
      className={cls(
        mergeClassNames(
          'kedao-container',
          className,
          disabled && 'disabled',
          readOnly && 'read-only',
          isFullscreen && 'fullscreen'
        )
      )}
    >
      <ControlBar
        ref={controlBarInstanceRef}
        editorState={editorState}
        getContainerNode={getContainerNode}
        className={cls(controlBarClassName)}
        style={controlBarStyle}
        editorId={editorId}
        media={controlBarMedia}
        controls={memoControls}
        extendControls={extendControls}
        textBackgroundColor={textBackgroundColor}
        allowInsertLinkText={allowInsertLinkText}
        isFullscreen={isFullscreen}
        onChange={setValue}
        onRequestFocus={requestFocus}
        commands={commands}
        mode={mode}
      />
      {componentBelowControlBar}
      <div
        onCompositionStart={handleCompositionStart}
        className={cls(`kedao-content ${contentClassName}`)}
        onCopy={handleCopyContent}
        style={contentStyle}
      >
        {renderEditor()}
      </div>
    </div>
  )
}

const JotaiWrapper: FC<KedaoEditorProps> = props => {
  return (
    <JotaiProvider>
      <KedaoEditor {...props} />
    </JotaiProvider>
  )
}

export { EditorState }

export default JotaiWrapper
