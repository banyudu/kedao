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
import { CallbackEditor, Language } from '../types'

import { defaultIconProps } from './props'

const iconProps = { ...defaultIconProps }

export default function Controls (lang: Language, editor: CallbackEditor) {
  return [
    {
      key: 'undo',
      title: lang.controls.undo,
      text: <MdUndo {...iconProps} />,
      type: 'editor-method',
      command: 'undo'
    },
    {
      key: 'redo',
      title: lang.controls.redo,
      text: <MdRedo {...iconProps} />,
      type: 'editor-method',
      command: 'redo'
    },
    {
      key: 'remove-styles',
      title: lang.controls.removeStyles,
      text: <MdClear {...iconProps} />,
      type: 'editor-method',
      command: 'removeSelectionInlineStyles'
    },
    {
      key: 'hr',
      title: lang.controls.hr,
      text: <MdHorizontalRule {...iconProps} />,
      type: 'editor-method',
      command: 'insertHorizontalLine'
    },
    {
      key: 'bold',
      title: lang.controls.bold,
      text: <MdFormatBold {...iconProps} />,
      type: 'inline-style',
      command: 'bold'
    },
    {
      key: 'italic',
      title: lang.controls.italic,
      text: <MdFormatItalic {...iconProps} />,
      type: 'inline-style',
      command: 'italic'
    },
    {
      key: 'underline',
      title: lang.controls.underline,
      text: <MdFormatUnderlined {...iconProps} />,
      type: 'inline-style',
      command: 'underline'
    },
    {
      key: 'strike-through',
      title: lang.controls.strikeThrough,
      text: <MdFormatStrikethrough {...iconProps} />,
      type: 'inline-style',
      command: 'strikethrough'
    },
    {
      key: 'superscript',
      title: lang.controls.superScript,
      text: <MdSuperscript {...iconProps} />,
      type: 'inline-style',
      command: 'superscript'
    },
    {
      key: 'subscript',
      title: lang.controls.subScript,
      text: <MdSubscript {...iconProps} />,
      type: 'inline-style',
      command: 'subscript'
    },
    {
      key: 'headings',
      title: lang.controls.headings,
      type: 'headings'
    },
    {
      key: 'blockquote',
      title: lang.controls.blockQuote,
      text: <MdFormatQuote {...iconProps} />,
      type: 'block-type',
      command: 'blockquote'
    },
    {
      key: 'code',
      title: lang.controls.code,
      text: <MdCode {...iconProps} />,
      type: 'block-type',
      command: 'code-block'
    },
    {
      key: 'list-ul',
      title: lang.controls.unorderedList,
      text: <MdFormatListBulleted {...iconProps} />,
      type: 'block-type',
      command: 'unordered-list-item'
    },
    {
      key: 'list-ol',
      title: lang.controls.orderedList,
      text: <MdFormatListNumbered {...iconProps} />,
      type: 'block-type',
      command: 'ordered-list-item'
    },
    {
      key: 'link',
      title: lang.controls.link,
      type: 'link'
    },
    {
      key: 'text-color',
      title: lang.controls.color,
      type: 'text-color'
    },
    {
      key: 'line-height',
      title: lang.controls.lineHeight,
      type: 'line-height'
    },
    {
      key: 'letter-spacing',
      title: lang.controls.letterSpacing,
      type: 'letter-spacing'
    },
    {
      key: 'text-indent',
      title: lang.controls.textIndent,
      type: 'text-indent'
    },
    {
      key: 'font-size',
      title: lang.controls.fontSize,
      type: 'font-size'
    },
    {
      key: 'font-family',
      title: lang.controls.fontFamily,
      type: 'font-family'
    },
    {
      key: 'text-align',
      title: lang.controls.textAlign,
      type: 'text-align'
    },
    {
      key: 'media',
      title: lang.controls.media,
      text: <MdLibraryMusic {...iconProps} />,
      type: 'media'
    },
    {
      key: 'emoji',
      title: lang.controls.emoji,
      text: <MdInsertEmoticon {...iconProps} />,
      type: 'emoji'
    },
    {
      key: 'clear',
      title: lang.controls.clear,
      text: <MdClearAll {...iconProps} />,
      type: 'editor-method',
      command: 'clearEditorContent'
    },
    {
      key: 'fullscreen',
      title: editor.isFullscreen
        ? lang.controls.exitFullscreen
        : lang.controls.fullscreen,
      text: editor.isFullscreen ? <MdFullscreenExit {...iconProps} /> : <MdFullscreen {...iconProps} />,
      type: 'editor-method',
      command: 'toggleFullscreen'
    },
    {
      key: 'modal',
      type: 'modal'
    },
    {
      key: 'button',
      type: 'button'
    },
    {
      key: 'dropdown',
      type: 'dropdown'
    },
    {
      key: 'component',
      type: 'component'
    }
  ]
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
