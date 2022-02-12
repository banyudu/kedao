import { EditorState } from 'draft-js'

const changeCurrentBlockType = (
  editorState: EditorState,
  type: string,
  text,
  blockMetadata = {}
) => {
  const currentContent = editorState.getCurrentContent()
  const selection = editorState.getSelection()
  const key = selection.getStartKey()
  const blockMap = currentContent.getBlockMap()
  const block = blockMap.get(key)
  const data = block.getData().merge(blockMetadata)
  const newBlock = block.merge({ type, data, text: text || '' })
  const newSelection = selection.merge({
    anchorOffset: 0,
    focusOffset: 0
  })
  const newContentState = currentContent.merge({
    blockMap: blockMap.set(key, newBlock as any),
    selectionAfter: newSelection
  })
  return EditorState.push(editorState, newContentState as any, 'change-block-type')
}

export default changeCurrentBlockType
