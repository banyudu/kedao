import { ContentUtils, ColorUtils } from '../utils'
import { RichUtils, Modifier, EditorState, ContentState } from 'draft-js'
import getFragmentFromSelection from 'draft-js/lib/getFragmentFromSelection'
import { handleNewLine } from 'draftjs-utils'
import { CallbackEditor } from '../types'
import defaultProps from './props'
import { convertEditorStateToHTML } from '../convert'

export const keyCommandHandlers = (command, editorState: EditorState, editor: CallbackEditor) => {
  if (
    editor.editorProps.handleKeyCommand?.(command, editorState, editor) ===
      'handled'
  ) {
    return 'handled'
  }

  if (command === 'kedao-save') {
    editor.editorProps.onSave?.(editorState)
    return 'handled'
  }

  const { controls, excludeControls } = editor.editorProps
  const allowIndent =
    (controls.indexOf('text-indent' as any) !== 0 ||
      controls.find((item) => item.key === 'text-indent')) &&
    !excludeControls.includes('text-indent')
  const cursorStart = editorState.getSelection().getStartOffset()
  const cursorEnd = editorState.getSelection().getEndOffset()
  const cursorIsAtFirst = cursorStart === 0 && cursorEnd === 0

  if (command === 'backspace') {
    if (!editor.editorProps.onDelete?.(editorState)) {
      return 'handled'
    }

    const blockType = ContentUtils.getSelectionBlockType(editorState)

    if (allowIndent && cursorIsAtFirst && blockType !== 'code-block') {
      editor.setValue(ContentUtils.decreaseSelectionIndent(editorState))
    }
  }

  if (command === 'tab') {
    const blockType = ContentUtils.getSelectionBlockType(editorState)

    if (blockType === 'code-block') {
      editor.setValue(
        ContentUtils.insertText(
          editorState,
          ' '.repeat(editor.editorProps.codeTabIndents)
        )
      )
      return 'handled'
    }
    if (
      blockType === 'ordered-list-item' ||
      blockType === 'unordered-list-item'
    ) {
      const newEditorState = RichUtils.onTab(event as any, editorState, 4)
      if (newEditorState !== editorState) {
        editor.setValue(newEditorState)
      }
      return 'handled'
    }
    if (blockType !== 'atomic' && allowIndent && cursorIsAtFirst) {
      editor.setValue(ContentUtils.increaseSelectionIndent(editorState))
      return 'handled'
    }
  }

  const nextEditorState = ContentUtils.handleKeyCommand(editorState, command)

  if (nextEditorState) {
    editor.setValue(nextEditorState)
    return 'handled'
  }

  return 'not-handled'
}

export const returnHandlers = (event, editorState: EditorState, editor: CallbackEditor) => {
  if (
    editor.editorProps.handleReturn?.(event, editorState, editor) === 'handled'
  ) {
    return 'handled'
  }

  const currentBlock = ContentUtils.getSelectionBlock(editorState)
  const currentBlockType = currentBlock.getType()

  if (
    currentBlockType === 'unordered-list-item' ||
    currentBlockType === 'ordered-list-item'
  ) {
    if (currentBlock.getLength() === 0) {
      editor.setValue(
        ContentUtils.toggleSelectionBlockType(editorState, 'unstyled')
      )
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
      editor.setValue(
        ContentUtils.toggleSelectionBlockType(editorState, 'unstyled')
      )
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
        editor.setValue(RichUtils.insertSoftNewline(editorState))
        return 'handled'
      }
    }
  }

  const nextEditorState = handleNewLine(editorState, event)

  if (nextEditorState) {
    editor.setValue(nextEditorState)
    return 'handled'
  }

  return 'not-handled'
}

export const beforeInputHandlers = (chars, editorState: EditorState, editor: CallbackEditor) => {
  if (
    editor.editorProps.handleBeforeInput?.(chars, editorState, editor) ===
      'handled'
  ) {
    return 'handled'
  }

  return 'not-handled'
}

export const compositionStartHandler = (_, editor: CallbackEditor) => {
  const { editorState } = editor
  const selectedBlocks = ContentUtils.getSelectedBlocks(editorState)

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

    editor.setValue(nextEditorState)
  }
}

export const dropHandlers = (selectionState, dataTransfer, editor: CallbackEditor) => {
  if (editor.editorProps.readOnly || editor.editorProps.disabled) {
    return 'handled'
  }

  if (window?.__KEDAO_DRAGING__IMAGE__) {
    let nextEditorState: any = EditorState.forceSelection(
      editor.editorState,
      selectionState
    )
    nextEditorState = ContentUtils.insertMedias(nextEditorState, [
      window.__KEDAO_DRAGING__IMAGE__.mediaData
    ])
    nextEditorState = ContentUtils.removeBlock(
      nextEditorState,
      window.__KEDAO_DRAGING__IMAGE__.block,
      nextEditorState.getSelection()
    )

    window.__KEDAO_DRAGING__IMAGE__ = null

    editor.lockOrUnlockEditor(true)
    editor.setValue(nextEditorState)

    return 'handled'
  }
  if (!dataTransfer || !dataTransfer.getText()) {
    return 'handled'
  }

  return 'not-handled'
}

export const handleFiles = (files, editor: CallbackEditor) => {
  const { pasteImage, validateFn, imagePasteLimit }: any = {
    ...defaultProps.media,
    ...editor.editorProps.media
  }

  if (pasteImage) {
    files.slice(0, imagePasteLimit).forEach((file) => {
      if (file && file.type.indexOf('image') > -1 && editor.finder) {
        const validateResult = validateFn ? validateFn(file) : true
        if (validateResult instanceof Promise) {
          validateResult.then(() => {
            editor.finder.uploadImage(file, (image) => {
              if (editor.isLiving) {
                editor.setValue(
                  ContentUtils.insertMedias(editor.editorState, [image])
                )
              }
            })
          }).catch(console.error)
        } else if (validateResult) {
          editor.finder.uploadImage(file, (image) => {
            if (editor.isLiving) {
              editor.setValue(
                ContentUtils.insertMedias(editor.editorState, [image])
              )
            }
          })
        }
      }
    })
  }

  if (files[0] && files[0].type.indexOf('image') > -1 && pasteImage) {
    return 'handled'
  }

  return 'not-handled'
}

export const droppedFilesHandlers = (selectionState, files, editor: CallbackEditor) => {
  if (
    editor.editorProps.handleDroppedFiles?.(selectionState, files, editor) ===
      'handled'
  ) {
    return 'handled'
  }

  return handleFiles(files, editor)
}

export const pastedFilesHandlers = (files, editor: CallbackEditor) => {
  if (
    editor.editorProps.handlePastedFiles?.(files, editor) === 'handled'
  ) {
    return 'handled'
  }

  return handleFiles(files, editor)
}

export const copyHandlers = (event, editor: CallbackEditor) => {
  const blockMap = getFragmentFromSelection(editor.editorState)

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

      const html = convertEditorStateToHTML(tempEditorState, editor.convertOptions)
      const text = tempEditorState.getCurrentContent().getPlainText()

      clipboardData.setData('text/html', html)
      clipboardData.setData('text/plain', text)

      event.preventDefault()
    } catch (error) {
      console.warn(error)
    }
  }
}

export const pastedTextHandlers = (text, html, editorState: EditorState, editor: CallbackEditor) => {
  if (
    editor.editorProps.handlePastedText?.(text, html, editorState, editor) ===
      'handled'
  ) {
    return 'handled'
  }

  if (!html || editor.editorProps.stripPastedStyles) {
    return false
  }

  const tempColors = ColorUtils.detectColorsFromHTMLString(html)

  editor.setTempColors(
    [...editor.tempColors, ...tempColors]
      .filter((item) => !editor.editorProps.colors.includes(item))
      .filter((item, index, array) => array.indexOf(item) === index)
    ,
    () => {
      editor.setValue(ContentUtils.insertHTML(editorState, editor.convertOptions, html, 'paste'))
    }
  )

  return 'handled'
}
