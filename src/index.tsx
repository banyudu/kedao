import { getDecorators } from './renderers'
import KedaoEditor, { EditorState } from './editor'

export default KedaoEditor
export { EditorState, getDecorators }

// 2.1 version development plan
// [] Optimizing the selection of multiple lines of text is an error when inserting a link
// [] Add a new image delete hook in the editor

// 2.2 development plan
// [] table function
// [] Beautify the UI, including icons and interface style

// version 2.3 development plan
// [] Primary md shortcut input support
// [] simple editing functions such as picture cropping
// [] allows custom shortcuts
