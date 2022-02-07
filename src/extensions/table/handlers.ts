import { CallbackEditor } from '../../types'
import { RichUtils } from 'draft-js'
import { ContentUtils } from '../../utils'
import * as TableUtils from './utils'

// todo
// 禁止选中多个单元格式时进行输入和粘贴操作
// 可以按tab/shift + tab键切换选中单元格
// 可以按方向键切换选中表格
// 在最后一个单元格中按Shift + 回车跳出表格

export const handleKeyCommand =
  (oringeHandler) => (command, editorState, editor: CallbackEditor) => {
    if (
      oringeHandler &&
      oringeHandler(command, editorState, editor) === 'handled'
    ) {
      return 'handled'
    }

    if (command === 'backspace') {
      const contentState = editorState.getCurrentContent()
      const focusOffset = editorState.getSelection().getFocusOffset()
      if (focusOffset === 0) {
        const currentBlock = ContentUtils.getSelectionBlock(editorState)
        const beforeBlock = contentState.getBlockBefore(currentBlock.getKey())
        if (!beforeBlock) return 'not-handled'
        if (beforeBlock.getType() === 'table-cell') {
          // 当前行 之前是表格的情况 特殊处理
          const tableKey = beforeBlock.getData().get('tableKey')
          editor.setValue(TableUtils.removeTable(editorState, tableKey))
          return 'handled'
        }
      }
    }

    const selectedBlocks = ContentUtils.getSelectedBlocks(editorState)
    if (!selectedBlocks.find((block) => block.getType() === 'table-cell')) {
      return 'not-handled'
    }

    const currentBlock = ContentUtils.getSelectionBlock(editorState)

    if (['backspace', 'delete'].includes(command)) {
      if (selectedBlocks.length > 1) {
        return 'handled'
      }

      const textLen = currentBlock.getLength()
      if (textLen === 0) {
        return 'handled'
      }

      const focusOffset = editorState.getSelection().getFocusOffset()
      if (command === 'backspace' && focusOffset === 0) {
        return 'handled'
      }
      if (command === 'delete' && focusOffset === textLen) {
        return 'handled'
      }
    } else if (command === 'tab') {
      return 'handled'
    }
  }

export const handleReturn = (oringeHandler) => (event, editorState, editor: CallbackEditor) => {
  if (
    oringeHandler &&
    oringeHandler(event, editorState, editor) === 'handled'
  ) {
    return 'handled'
  }

  if (!ContentUtils.selectionContainsBlockType(editorState, 'table-cell')) {
    return 'not-handled'
  }

  const blockType = ContentUtils.getSelectionBlockType(editorState)

  if (blockType !== 'table-cell') {
    return 'not-handled'
  }

  editor.setValue(RichUtils.insertSoftNewline(editorState))
  return 'handled'
}

export const handleDroppedFiles =
  (oringeHandler) => (selectionState, files, editor: CallbackEditor) => {
    if (
      oringeHandler &&
      oringeHandler(selectionState, files, editor) === 'handled'
    ) {
      return 'handled'
    }

    if (
      !ContentUtils.selectionContainsBlockType(
        editor.editorState,
        'table-cell'
      )
    ) {
      return 'not-handled'
    }

    const currentBlock = ContentUtils.getSelectionBlock(
      editor.editorState
    )

    if (currentBlock.getType() === 'table-cell') {
      return 'handled'
    }
  }

export const handlePastedFiles = (oringeHandler) => (files, editor: CallbackEditor) => {
  if (oringeHandler && oringeHandler(files, editor) === 'handled') {
    return 'handled'
  }

  if (
    !ContentUtils.selectionContainsBlockType(
      editor.editorState,
      'table-cell'
    )
  ) {
    return 'not-handled'
  }

  const currentBlock = ContentUtils.getSelectionBlock(editor.editorState)

  if (currentBlock.getType() === 'table-cell') {
    return 'handled'
  }
}

export const handlePastedText =
  (oringeHandler) => (text, html, editorState, editor: CallbackEditor) => {
    if (
      oringeHandler &&
      oringeHandler(text, html, editorState, editor) === 'handled'
    ) {
      return 'handled'
    }

    const selectedBlocks = ContentUtils.getSelectedBlocks(
      editor.editorState
    )

    if (!selectedBlocks.find((block) => block.getType() === 'table-cell')) {
      return 'not-handled'
    }

    if (selectedBlocks.length === 1) {
      editor.setValue(ContentUtils.insertText(editor.editorState, text))
    }

    return 'handled'
  }
