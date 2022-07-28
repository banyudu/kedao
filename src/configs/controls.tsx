import React from 'react'
import {
  MdUndo,
  MdRedo,
  MdClear,
  MdFormatBold,
  MdHorizontalRule,
  MdFormatItalic,
  MdFormatUnderlined,
  MdFormatStrikethrough,
  MdSuperscript,
  MdSubscript,
  MdFormatQuote,
  MdCode,
  MdFormatListBulleted,
  MdFormatListNumbered,
  MdLibraryMusic,
  MdInsertEmoticon,
  MdClearAll,
  MdFullscreen,
  MdFullscreenExit,
  MdFormatAlignLeft,
  MdFormatAlignRight,
  MdFormatAlignCenter,
  MdFormatSize,
  MdLink,
  MdRemove
} from 'react-icons/md'
import { ControlItem, Language } from '../types'

import { defaultIconProps } from './props'

const iconProps = { ...defaultIconProps }

export default function Controls (
  lang: Language,
  isFullscreen: boolean
): Record<string, ControlItem> {
  return {
    undo: {
      key: 'undo',
      title: lang.controls.undo,
      text: <MdUndo {...iconProps} />,
      type: 'editor-method',
      command: 'undo'
    },
    redo: {
      key: 'redo',
      title: lang.controls.redo,
      text: <MdRedo {...iconProps} />,
      type: 'editor-method',
      command: 'redo'
    },
    'remove-styles': {
      key: 'remove-styles',
      title: lang.controls.removeStyles,
      text: <MdClear {...iconProps} />,
      type: 'editor-method',
      command: 'removeSelectionInlineStyles'
    },
    hr: {
      key: 'hr',
      title: lang.controls.hr,
      text: <MdHorizontalRule {...iconProps} />,
      type: 'editor-method',
      command: 'insertHorizontalLine'
    },
    bold: {
      key: 'bold',
      title: lang.controls.bold,
      text: <MdFormatBold {...iconProps} />,
      type: 'inline-style',
      command: 'bold'
    },
    italic: {
      key: 'italic',
      title: lang.controls.italic,
      text: <MdFormatItalic {...iconProps} />,
      type: 'inline-style',
      command: 'italic'
    },
    underline: {
      key: 'underline',
      title: lang.controls.underline,
      text: <MdFormatUnderlined {...iconProps} />,
      type: 'inline-style',
      command: 'underline'
    },
    'strike-through': {
      key: 'strike-through',
      title: lang.controls.strikeThrough,
      text: <MdFormatStrikethrough {...iconProps} />,
      type: 'inline-style',
      command: 'strikethrough'
    },
    superscript: {
      key: 'superscript',
      title: lang.controls.superScript,
      text: <MdSuperscript {...iconProps} />,
      type: 'inline-style',
      command: 'superscript'
    },
    subscript: {
      key: 'subscript',
      title: lang.controls.subScript,
      text: <MdSubscript {...iconProps} />,
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
      text: <MdFormatQuote {...iconProps} />,
      type: 'block-type',
      command: 'blockquote'
    },
    code: {
      key: 'code',
      title: lang.controls.code,
      text: <MdCode {...iconProps} />,
      type: 'block-type',
      command: 'code-block'
    },
    'list-ul': {
      key: 'list-ul',
      title: lang.controls.unorderedList,
      text: <MdFormatListBulleted {...iconProps} />,
      type: 'block-type',
      command: 'unordered-list-item'
    },
    'list-ol': {
      key: 'list-ol',
      title: lang.controls.orderedList,
      text: <MdFormatListNumbered {...iconProps} />,
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
      text: <MdLibraryMusic {...iconProps} />,
      type: 'media'
    },
    emoji: {
      key: 'emoji',
      title: lang.controls.emoji,
      text: <MdInsertEmoticon {...iconProps} />,
      type: 'emoji'
    },
    clear: {
      key: 'clear',
      title: lang.controls.clear,
      text: <MdClearAll {...iconProps} />,
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
        <MdFullscreenExit {...iconProps} />
          )
        : (
        <MdFullscreen {...iconProps} />
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

export const imageControlItems = {
  'float-left': {
    text: <MdFormatAlignLeft {...iconProps} />,
    command: 'setImageFloat|left'
  },
  'float-right': {
    text: <MdFormatAlignRight {...iconProps} />,
    command: 'setImageFloat|right'
  },
  'align-left': {
    text: <MdFormatAlignLeft {...iconProps} />,
    command: 'setImageAlignment|left'
  },
  'align-center': {
    text: <MdFormatAlignCenter {...iconProps} />,
    command: 'setImageAlignment|center'
  },
  'align-right': {
    text: <MdFormatAlignRight {...iconProps} />,
    command: 'setImageAlignment|right'
  },
  size: {
    text: <MdFormatSize {...iconProps} />,
    command: 'toggleSizeEditor'
  },
  link: {
    text: <MdLink {...iconProps} />,
    command: 'toggleLinkEditor'
  },
  remove: {
    text: <MdRemove {...iconProps} />,
    command: 'removeImage'
  }
}
