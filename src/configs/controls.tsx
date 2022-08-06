import React from 'react'
import Icon from '../components/Icon'
import { ControlItem, Language } from '../types'

export default function Controls (
  lang: Language,
  isFullscreen: boolean
): Record<string, ControlItem> {
  return {
    undo: {
      key: 'undo',
      title: lang.controls.undo,
      text: <Icon type='undo' />,
      type: 'editor-method',
      command: 'undo'
    },
    redo: {
      key: 'redo',
      title: lang.controls.redo,
      text: <Icon type='redo' />,
      type: 'editor-method',
      command: 'redo'
    },
    'remove-styles': {
      key: 'remove-styles',
      title: lang.controls.removeStyles,
      text: <Icon type='clear' />,
      type: 'editor-method',
      command: 'removeSelectionInlineStyles'
    },
    hr: {
      key: 'hr',
      title: lang.controls.hr,
      text: <Icon type='horizontal-rule' />,
      type: 'editor-method',
      command: 'insertHorizontalLine'
    },
    bold: {
      key: 'bold',
      title: lang.controls.bold,
      text: <Icon type='format-bold' />,
      type: 'inline-style',
      command: 'bold'
    },
    italic: {
      key: 'italic',
      title: lang.controls.italic,
      text: <Icon type='format-italic' />,
      type: 'inline-style',
      command: 'italic'
    },
    underline: {
      key: 'underline',
      title: lang.controls.underline,
      text: <Icon type='format-underlined' />,
      type: 'inline-style',
      command: 'underline'
    },
    'strike-through': {
      key: 'strike-through',
      title: lang.controls.strikeThrough,
      text: <Icon type='format-strikethrough' />,
      type: 'inline-style',
      command: 'strikethrough'
    },
    superscript: {
      key: 'superscript',
      title: lang.controls.superScript,
      text: <Icon type='superscript' />,
      type: 'inline-style',
      command: 'superscript'
    },
    subscript: {
      key: 'subscript',
      title: lang.controls.subScript,
      text: <Icon type='subscript' />,
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
      text: <Icon type='format-quote' />,
      type: 'block-type',
      command: 'blockquote'
    },
    code: {
      key: 'code',
      title: lang.controls.code,
      text: <Icon type='code' />,
      type: 'block-type',
      command: 'code-block'
    },
    'list-ul': {
      key: 'list-ul',
      title: lang.controls.unorderedList,
      text: <Icon type='format-list-bulleted' />,
      type: 'block-type',
      command: 'unordered-list-item'
    },
    'list-ol': {
      key: 'list-ol',
      title: lang.controls.orderedList,
      text: <Icon type='format-list-numbered' />,
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
      text: <Icon type='library-music' />,
      type: 'media'
    },
    emoji: {
      key: 'emoji',
      title: lang.controls.emoji,
      text: <Icon type='insert-emoticon' />,
      type: 'emoji'
    },
    clear: {
      key: 'clear',
      title: lang.controls.clear,
      text: <Icon type='clear-all' />,
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
        <Icon type='fullscreen-exit' />
          )
        : (
        <Icon type='fullscreen' />
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
    text: <Icon type='format-align-left' />,
    command: 'setImageFloat|left'
  },
  'float-right': {
    text: <Icon type='format-align-right' />,
    command: 'setImageFloat|right'
  },
  'align-left': {
    text: <Icon type='format-align-left' />,
    command: 'setImageAlignment|left'
  },
  'align-center': {
    text: <Icon type='format-align-center' />,
    command: 'setImageAlignment|center'
  },
  'align-right': {
    text: <Icon type='format-align-right' />,
    command: 'setImageAlignment|right'
  },
  size: {
    text: <Icon type='format-size' />,
    command: 'toggleSizeEditor'
  },
  link: {
    text: <Icon type='link' />,
    command: 'toggleLinkEditor'
  },
  remove: {
    text: <Icon type='remove' />,
    command: 'removeImage'
  }
}
