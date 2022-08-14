import {
  EditorState,
  EditorProps,
  ContentState,
  ContentBlock,
  DraftDecorator,
  CompositeDecorator,
  DraftStyleMap,
  DraftBlockRenderMap
} from 'draft-js'
import * as React from 'react'

export { EditorState, EditorProps }

export interface ConvertOptions {
  editorId?: string
  fontFamilies?: readonly FontFamily[]
  styleImportFn?: Function
  styleExportFn?: Function
  entityImportFn?: Function
  entityExportFn?: Function
  blockImportFn?: Function
  blockExportFn?: Function
  unitImportFn?: Function
  unitExportFn?: Function
  contentState?: ContentState
}

export type KeyCommand = string

export interface Language {
  base: {
    remove: string
    cancel: string
    confirm: string
    insert: string
    width: string
    height: string
  }
  controls: {
    clear: string
    undo: string
    redo: string
    fontSize: string
    color: string
    textColor: string
    tempColors: string
    backgroundColor: string
    bold: string
    lineHeight: string
    letterSpacing: string
    textIndent: string
    increaseIndent: string
    decreaseIndent: string
    border: string
    italic: string
    underline: string
    strikeThrough: string
    fontFamily: string
    textAlign: string
    alignLeft: string
    alignCenter: string
    alignRight: string
    alignJustify: string
    floatLeft: string
    floatRight: string
    superScript: string
    subScript: string
    removeStyles: string
    headings: string
    header: string
    normal: string
    orderedList: string
    unorderedList: string
    blockQuote: string
    code: string
    link: string
    unlink: string
    hr: string
    media: string
    mediaLibirary: string
    emoji: string
    fullscreen: string
    exitFullscreen: string
  }
  linkEditor: {
    textInputPlaceHolder: string
    linkInputPlaceHolder: string
    inputWithEnterPlaceHolder: string
    openInNewWindow: string
    removeLink: string
  }
  audioPlayer: {
    title: string
  }
  videoPlayer: {
    title: string
    embedTitle: string
  }
  media: {
    image: string
    video: string
    audio: string
    embed: string
  }
  finder: {
    remove: string
    cancel: string
    confirm: string
    insert: string
    width: string
    height: string
    image: string
    video: string
    audio: string
    embed: string
    caption: string
    dragTip: string
    dropTip: string
    selectAll: string
    deselect: string
    removeSelected: string
    externalInputPlaceHolder: string
    externalInputTip: string
    addLocalFile: string
    addExternalSource: string
    unnamedItem: string
    confirmInsert: string
  }
}

export interface Finder {
  ReactComponent: React.ComponentType<any>
  uploadImage: (file: File, callback: (url: string) => void) => void
}

export interface MediaProps {
  onClose?: () => void
  onCancel: () => void
  onInsert: (medias: any) => void
  onChange: (files: File[]) => void
  uploadFn?: Function
  validateFn?: (file: File) => boolean | PromiseLike<any>
  accepts: MediaType['accepts']
  externals: {
    audio?: boolean
    video?: boolean
    image?: boolean
    embed?: boolean
  }
  image: boolean
  audio: boolean
  video: boolean
}

export interface CommonPickerProps {
  editorState: EditorState
  editorId: string
  getContainerNode: () => HTMLElement
  onRequestFocus: () => void
  onChange: (
    editorState: EditorState,
    callback?: (state: EditorState) => void
  ) => void
}

export type BuiltInControlNames =
  | 'blockquote'
  | 'bold'
  | 'code'
  | 'clear'
  | 'emoji'
  | 'font-family'
  | 'font-size'
  | 'fullscreen'
  | 'headings'
  | 'hr'
  | 'italic'
  | 'letter-spacing'
  | 'line-height'
  | 'link'
  | 'list-ol'
  | 'list-ul'
  | 'media'
  | 'redo'
  | 'remove-styles'
  | 'separator'
  | 'strike-through'
  | 'superscript'
  | 'subscript'
  | 'text-align'
  | 'text-color'
  | 'text-indent'
  | 'underline'
  | 'undo'
  | 'table'

interface BaseControlItem {
  key: string
  title?: string
  text?: string | React.ReactNode
  disabled?: boolean
  command?: KeyCommand
}

export interface BuiltInControlItem extends BaseControlItem {
  type: BuiltInControlNames
  key: BuiltInControlNames
}

interface BaseExtendControlItem extends BaseControlItem {
  className?: string
  html?: string | null
}

export interface ButtonControlItem extends BaseExtendControlItem {
  type: 'button'
  onClick?: (e: any) => void
}

export interface DropDownControlItem extends BaseExtendControlItem {
  type: 'dropdown'
  showArrow?: boolean
  arrowActive?: boolean
  autoHide?: boolean
  component?: React.ReactNode
}

export interface ModalProps {
  id?: string
  title?: string
  className?: string
  width?: number
  height?: number
  confirmable?: boolean
  closeOnConfirm?: boolean
  onConfirm?: () => void
  onCreate?: () => void
  showFooter?: boolean
  showCancel?: boolean
  showConfirm?: boolean
  onBlur?: () => void
  showClose?: boolean
  cancelText?: string
  onClose?: () => void
  confirmText?: string
  onCancel?: () => void
  closeOnBlur?: boolean
  bottomText?: React.ReactNode
  closeOnCancel?: boolean
  visible?: boolean
}

export interface ModalControlItem extends BaseExtendControlItem {
  type: 'modal'
  onClick?: (e: any) => void
  modal?: ModalProps
}

interface ComponentControlItem extends BaseExtendControlItem {
  type: 'component'
  component?: React.ReactNode
}

interface BlockControlItem extends BaseControlItem {
  type: 'block-type'
}

interface InlineStyleControlItem extends BaseControlItem {
  type: 'inline-style'
}

interface EditorMethodControlItem extends BaseControlItem {
  type: 'editor-method'
}

export type ControlItem =
  | BuiltInControlItem
  | BlockControlItem
  | InlineStyleControlItem
  | EditorMethodControlItem
  | ButtonControlItem
  | DropDownControlItem
  | ModalControlItem
  | ComponentControlItem

export interface MediaType {
  items?: any[]
  uploadFn?: (params: {
    file: File
    progress: (progress: number) => void
    libraryId: string
    success: (res: {
      url: string
      meta?: {
        id?: string
        title?: string
        alt?: string
        loop?: boolean
        autoPlay?: boolean
        controls?: boolean
        poster?: string
      }
    }) => void
    error: (err: { msg: string }) => void
  }) => void
  validateFn?: (file: File) => boolean | PromiseLike<any>
  accepts?: {
    image?: string | false
    video?: string | false
    audio?: string | false
  }
  externals?: {
    image?: boolean
    video?: boolean
    audio?: boolean
    embed?: boolean
  }
  onInsert?: Function
  onChange?: Function
  pasteImage?: boolean
}

export type ImageControlItem =
  | 'float-left'
  | 'float-right'
  | 'align-left'
  | 'align-center'
  | 'align-right'
  | 'link'
  | 'size'
  | 'remove'
  | {
    text?: string
    render?: (mediaData: any, block?: ContentBlock) => void
    onClick?: (block: ContentBlock) => void
  }

export interface Position {
  float?: any
  alignment?: any
}

export interface Extension {
  name?: string
  type?: string
  style?: React.CSSProperties
  includeEditors: string[]
  excludeEditors: string[]
  control?: Function
  decorator?: DraftDecorator | CompositeDecorator
  importer?: Function
  exporter?: Function
  interceptor?: (editorProps: EditorProps) => EditorProps
  component?: React.ComponentType<any>
  rendererFn?: Function
  renderMap?: (editorProps: EditorProps) => RenderMap
  styleFn?: Function
  mutability?: string
  data: any
  strategy?: DraftDecorator['strategy']
}

export type RenderMap = Immutable.Map<
string,
{ element: React.ComponentType<any> }
>

export interface BlockRenderProps {
  mediaData?: any
  onRemove: () => void
  editorState: EditorState
  contentState: ContentState
}

export interface BlockRenderer {
  component: (props: BlockRenderProps) => JSX.Element
  editable: boolean
}
export type BlockRendererFn = (block: ContentBlock, { editorState: EditorState }) => BlockRenderer

export interface FontFamily {
  name: string
  family: string
}

export interface DropDownProps {
  disabled?: boolean
  autoHide: boolean
  caption: React.ReactNode
  htmlCaption?: string
  title: string
  showArrow?: boolean
  arrowActive?: boolean
  className?: string
  isActive?: boolean
  onActiveChage?: (value: boolean) => void
  getContainerNode: () => HTMLElement
  children: React.ReactNode
}

export interface ColorPickerProps {
  presetColors: string[]
  color: string
  onChange: (color: string, closePicker: boolean) => void
}

export interface EmojiPickerProps
  extends CommonPickerProps,
  Pick<DropDownProps, 'getContainerNode'> {
  defaultCaption: DropDownProps['caption']
  emojis?: readonly string[]
}

export interface FinderProps extends MediaProps {
}

export interface FontFamilyPickerProps
  extends CommonPickerProps,
  Pick<DropDownProps, 'getContainerNode'> {
  fontFamilies?: readonly FontFamily[]
  defaultCaption: DropDownProps['caption']
}

export interface FontSizePickerProps extends CommonPickerProps {
  defaultCaption: DropDownProps['caption']
  fontSizes?: number[]
  onChange: (
    editorState: EditorState,
    callback?: (state: EditorState) => void
  ) => void
  onRequestFocus: () => void
}

export interface HeadingsPickerProps
  extends Omit<CommonPickerProps, 'onChange'> {
  headings?: string[]
  current: any
  onChange: (command: string, type: string) => void
}

export interface LetterSpacingPickerProps extends CommonPickerProps {
  letterSpacings?: number[]
  defaultCaption: DropDownProps['caption']
  onRequestFocus: () => void
  onChange: (
    editorState: EditorState,
    callback?: (state: EditorState) => void
  ) => void
}

export interface LineHeightPickerProps extends CommonPickerProps {
  lineHeights?: number[]
  defaultCaption: DropDownProps['caption']
  onRequestFocus: () => void
  onChange: (
    editorState: EditorState,
    callback?: (state: EditorState) => void
  ) => void
}

export interface LinkEditorProps extends CommonPickerProps {
  defaultLinkTarget?: string
  allowInsertLinkText: boolean
}

export interface TextAlignProps extends CommonPickerProps {
  textAligns?: string[]
}

export interface TextColorPickerProps
  extends Pick<DropDownProps, 'getContainerNode'> {
  editorState: EditorState
  enableBackgroundColor: boolean
  colors: string[]
  onChange: (state: EditorState) => void
  onRequestFocus: () => void
}

export type SupportedLangs = 'zh' | 'zh-hant' | 'en' | 'tr' | 'ru' | 'jpn' | 'kr' | 'pl'

export interface KedaoEditorProps {
  value?: EditorState
  defaultValue?: EditorState
  placeholder?: string
  id?: string
  editorId?: string
  readOnly?: boolean
  language?: SupportedLangs
  controls?: readonly ControlItem[] | readonly BuiltInControlItem[]
  excludeControls?: BuiltInControlNames[]
  extendControls?: Array<
  DropDownControlItem | ButtonControlItem | ModalControlItem
  >
  componentBelowControlBar?: React.ReactNode
  media?: MediaProps
  imageControls?: readonly ImageControlItem[]
  imageResizable?: boolean
  imageEqualRatio?: boolean
  blockRenderMap?: DraftBlockRenderMap
  blockRendererFn?: BlockRendererFn
  customStyleFn?: Function
  customStyleMap?: DraftStyleMap
  blockStyleFn?: Function
  keyBindingFn?: Function
  converts?: object
  textBackgroundColor?: boolean
  allowInsertLinkText?: boolean
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
