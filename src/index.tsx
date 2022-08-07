import { getDecorators } from './renderers'
import KedaoEditor, { EditorState } from './editor'

export default KedaoEditor
export { EditorState, getDecorators }
export {
  convertRawToHTML,
  convertHTMLToRaw,
  convertEditorStateToHTML,
  convertHTMLToEditorState,
  convertEditorStateToRaw,
  convertRawToEditorState,
  convertFromRaw,
  convertToRaw
} from './utils'
