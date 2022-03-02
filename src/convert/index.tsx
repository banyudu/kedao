import { convertToHTML, convertFromHTML } from 'draft-convert'
import {
  getToHTMLConfig,
  getFromHTMLConfig,
  defaultFontFamilies
} from './configs'
import { convertFromRaw, convertToRaw, EditorState } from 'draft-js'
import { ConvertOptions } from '../types'

const defaultConvertOptions = {
  fontFamilies: defaultFontFamilies
}

export const convertRawToHTML = (rawContent, options) => {
  options = { ...defaultConvertOptions, ...options }

  try {
    const contentState = convertFromRaw(rawContent)
    options.contentState = contentState
    return convertToHTML(getToHTMLConfig(options))(contentState)
  } catch (error) {
    console.warn(error)
    return ''
  }
}

export const convertHTMLToRaw = (HTMLString: string, options?: ConvertOptions, source?: string) => {
  options = { ...defaultConvertOptions, ...options }

  try {
    const contentState = convertFromHTML(getFromHTMLConfig(options, source))(
      HTMLString
    )
    return convertToRaw(contentState)
  } catch (error) {
    console.warn(error)
    return {}
  }
}

export const convertEditorStateToHTML = (editorState: EditorState, options) => {
  options = { ...defaultConvertOptions, ...options }

  try {
    const contentState = editorState.getCurrentContent()
    options.contentState = contentState
    return convertToHTML(getToHTMLConfig(options))(contentState)
  } catch (error) {
    console.warn(error)
    return ''
  }
}

export const convertHTMLToEditorState = (
  HTMLString: string,
  editorDecorators,
  options: ConvertOptions,
  source?: string
) => {
  options = { ...defaultConvertOptions, ...options }

  try {
    return EditorState.createWithContent(
      convertFromHTML(getFromHTMLConfig(options, source))(HTMLString),
      editorDecorators
    )
  } catch (error) {
    console.warn(error)
    return EditorState.createEmpty(editorDecorators)
  }
}

export const convertEditorStateToRaw = (editorState: EditorState) => {
  return convertToRaw(editorState.getCurrentContent())
}

export const convertRawToEditorState = (rawContent, editorDecorators?) => {
  try {
    return EditorState.createWithContent(
      convertFromRaw(rawContent),
      editorDecorators
    )
  } catch (error) {
    console.warn(error)
    return EditorState.createEmpty(editorDecorators)
  }
}

export { convertFromRaw, convertToRaw }
