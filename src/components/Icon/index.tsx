import React, { FC, SVGAttributes } from 'react'
import {
  MdArrowDropDown,
  MdLinkOff,
  MdVideocam,
  MdPlayArrow,
  MdFormatColorText,
  MdFormatIndentDecrease,
  MdFormatAlignJustify,
  MdAdd,
  MdAudiotrack,
  MdCheck,
  MdMusicVideo,
  MdFormatIndentIncrease,
  MdDescription,
  MdDone,
  MdMovie,
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
  MdRemove,
  MdClose
} from 'react-icons/md'

const iconComponentMap = {
  add: MdAdd,
  audiotrack: MdAudiotrack,
  check: MdCheck,
  close: MdClose,
  clear: MdClear,
  code: MdCode,
  description: MdDescription,
  done: MdDone,
  fullscreen: MdFullscreen,
  link: MdLink,
  movie: MdMovie,
  redo: MdRedo,
  remove: MdRemove,
  subscript: MdSubscript,
  superscript: MdSuperscript,
  undo: MdUndo,
  videocam: MdVideocam,
  'arrow-drop-down': MdArrowDropDown,
  'clear-all': MdClearAll,
  'format-align-center': MdFormatAlignCenter,
  'format-align-justify': MdFormatAlignJustify,
  'format-align-left': MdFormatAlignLeft,
  'format-align-right': MdFormatAlignRight,
  'format-bold': MdFormatBold,
  'format-color-text': MdFormatColorText,
  'format-indent-decrease': MdFormatIndentDecrease,
  'format-indent-increase': MdFormatIndentIncrease,
  'format-italic': MdFormatItalic,
  'format-list-bulleted': MdFormatListBulleted,
  'format-list-numbered': MdFormatListNumbered,
  'format-quote': MdFormatQuote,
  'format-size': MdFormatSize,
  'format-strikethrough': MdFormatStrikethrough,
  'format-underlined': MdFormatUnderlined,
  'fullscreen-exit': MdFullscreenExit,
  'horizontal-rule': MdHorizontalRule,
  'insert-emoticon': MdInsertEmoticon,
  'library-music': MdLibraryMusic,
  'link-off': MdLinkOff,
  'music-video': MdMusicVideo,
  'play-arrow': MdPlayArrow
}

interface IconProps extends Pick<SVGAttributes<SVGElement>, 'onClick' | 'style' | 'className' | 'color'> {
  type: keyof typeof iconComponentMap
  size?: number
}

const Icon: FC<IconProps> = ({ type, size = 20, ...props }) => {
  const Component = iconComponentMap[type]
  if (!Component) {
    return null
  }
  return (
    <Component
      {...props}
      size={size}
    />
  )
}

export default Icon
