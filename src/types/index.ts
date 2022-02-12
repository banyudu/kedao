import { EditorState, EditorProps, ContentState } from 'draft-js'
import * as React from 'react'

export { EditorState, EditorProps }

/**
 * editor 提供给组件的回调函数集合
 */
export interface CallbackEditor {
  isFullscreen: boolean
  setValue: (v: EditorState) => void
  getValue: () => EditorState
  requestFocus: () => void
  onChange: (editorState: EditorState, callback?) => void
  setOnChange: (onChange: (editorState: EditorState, callback?) => void) => void
  lockOrUnlockEditor: (lock: boolean) => void
  editorProps: {
    codeTabIndents: number
    controls: ControlItem[]
    excludeControls: string[]
    handleKeyCommand: (command: KeyCommand, editorState: EditorState, editor: CallbackEditor) => string
    onSave: (state: EditorState) => void
    onDelete: (state: EditorState) => boolean
    handleReturn: (event, editorState: EditorState, editor: CallbackEditor) => string
    handleBeforeInput: (chars, editorState: EditorState, editor: CallbackEditor) => string
    readOnly: boolean
    disabled: boolean
    media: any
    handlePastedText: (text, html, editorState, editor: CallbackEditor) => string
    stripPastedStyles: any
    colors: string[]
    handleDroppedFiles: (selectionState, files, editor: CallbackEditor) => string
    handlePastedFiles: (files, editor: CallbackEditor) => string
    language: any
  }
  editorState: EditorState
  finder: Finder
  isLiving: boolean
  tempColors: string[]
  setTempColors: (colors: string[], callback: () => void) => void
  convertOptions: ConvertOptions
  blur: () => void
  readOnly: boolean
}

export interface ConvertOptions {
  editorId?: string
  fontFamilies?: Array<{ name: string, family: string }>
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
}

export type Hooks = (name: string, _?) => Function

export interface Finder {
  ReactComponent: React.ComponentType<any>
  uploadImage: (file: File, callback: (url: string) => void) => void
}

export interface MediaProps {
  onClose: () => void
  onCancel: () => void
  onInsert: (medias: any) => void
  onChange: () => void
  accepts: string[]
  externals: string[]
  image: boolean
  audio: boolean
  video: boolean
}

export interface CommonPickerProps {
  hooks: Hooks
  editor: CallbackEditor
  editorState: EditorState
  editorId: string
  language: Language
  getContainerNode: () => HTMLElement
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
  key: string
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

export interface ModalControlItem extends BaseExtendControlItem {
  type: 'modal'
  onClick?: (e: any) => void
  modal?: {
    id: string
    title?: string
    className?: string
    width?: number
    height?: number
    showFooter?: boolean
    showCancel?: boolean
    showConfirm?: boolean
    confirmable?: boolean
    showClose?: boolean
    closeOnBlur?: boolean
    closeOnConfirm?: boolean
    closeOnCancel?: boolean
    cancelText?: string
    confirmText?: string
    bottomText?: React.ReactNode
    onConfirm?: () => void
    onCancel?: () => void
    onClose?: () => void
    onBlur?: () => void
    onCreate?: (v: any) => void
    children: React.ReactNode
  }
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
    render?: (mediaData: any) => void
    onClick?: (block: any) => void
  }
