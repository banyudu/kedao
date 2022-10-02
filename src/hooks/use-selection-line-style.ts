import { EditorState } from 'draft-js'
import { useCallback, useMemo } from 'react'
import { getSelectionInlineStyle, toggleSelectionInlineStyle } from '../utils'

const useSelectionInlineStyle = (editorState: EditorState, type: string) => {
  // FONTSIZE-xxx
  const prefix = `${type.toUpperCase()}-`
  const value = useMemo(() => {
    const inlineStyle = getSelectionInlineStyle(editorState)

    const keys = inlineStyle.keySeq().toArray()

    const first = keys.find(item => item.startsWith(prefix))
    if (!first) {
      // return null if not found
      return null
    }

    // remove prefix
    return first.replace(prefix, '')
  }, [editorState])

  // toggle inline style to new value
  const toggle = useCallback((newValue: string) => {
    return toggleSelectionInlineStyle(editorState, newValue, prefix)
  }, [editorState, prefix])

  return { value, toggle }
}

export default useSelectionInlineStyle
