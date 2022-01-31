import { EditorState, SelectionState, Modifier } from 'draft-js'
import { ContentUtils } from '@kedao/utils'

const insertImage = (editorState, matchArr) => {
  const currentContent = editorState.getCurrentContent()
  const selection = editorState.getSelection()
  const key = selection.getStartKey()
  const [matchText, alt, src, title] = matchArr
  const { index } = matchArr
  const focusOffset = index + matchText.length
  const wordSelection = SelectionState.createEmpty(key).merge({
    anchorOffset: index,
    focusOffset
  })

  const newContentState = Modifier.replaceText(
    currentContent,
    wordSelection,
    ''
  )
  const nextEditorState = EditorState.push(
    editorState,
    newContentState,
    'insert-image' as any
  )
  // nextEditorState = EditorState.forceSelection(nextEditorState, newContentState.getSelectionAfter())

  return ContentUtils.insertMedias(nextEditorState, [
    {
      type: 'IMAGE',
      name: alt || title,
      url: src,
      meta: { alt, title }
    }
  ])
}

export default insertImage
