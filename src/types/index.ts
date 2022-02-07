import { EditorState } from 'draft-js'

export { EditorState }

/**
 * editor 提供给组件的回调函数集合
 */
export interface CallbackEditor {
  isFullscreen: boolean
  setValue: (v: EditorState) => void
  requestFocus: () => void
  editorProps: {
    codeTabIndents: number
    controls: ControlItem[]
    excludeControls: string[]
    handleKeyCommand: (command: KeyCommand, editorState: EditorState, editor: CallbackEditor) => string
    onSave: (state: EditorState) => void
    onDelete: (state: EditorState) => boolean
  }
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

export interface ControlItem {
  key: string
  title: string
  text: JSX.Element
  type: string
  command: string
}

export interface CommonPickerProps {
  hooks: Hooks
  editor: CallbackEditor
  editorState: EditorState
  editorId: string
  language: Language
  getContainerNode: () => HTMLElement
}
