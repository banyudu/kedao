import { EditorState, DraftDecoratorType } from 'draft-js'
import {
  convertRawToEditorState,
  convertHTMLToEditorState,
  convertEditorStateToRaw,
  convertEditorStateToHTML
} from '../convert'

import {
  compositeStyleImportFn,
  compositeStyleExportFn,
  compositeEntityImportFn,
  compositeEntityExportFn,
  compositeBlockImportFn,
  compositeBlockExportFn
} from '../helpers/extension'
import { getDecorators } from '../renderers'
import defaultProps from '../configs/props'

export default class KedaoEditorState extends EditorState {
  convertOptions: any

  setConvertOptions (options = {}) {
    this.convertOptions = options
  }

  toHTML (options = {}) {
    const convertOptions = this.convertOptions || {}
    return convertEditorStateToHTML(this, { ...convertOptions, ...options })
  }

  toRAW (noStringify) {
    return noStringify
      ? convertEditorStateToRaw(this)
      : JSON.stringify(convertEditorStateToRaw(this))
  }

  toText () {
    return this.getCurrentContent().getPlainText()
  }

  override isEmpty () {
    return !this.getCurrentContent().hasText()
  }

  static override createEmpty (decorator?: DraftDecoratorType): KedaoEditorState {
    const emptyState = super.createEmpty(decorator)
    return KedaoEditorState.fromEditorState(emptyState)
  }

  static fromEditorState (editorState: EditorState): KedaoEditorState {
    const result: KedaoEditorState = editorState as any
    const keys = ['setConvertOptions', 'toHTML', 'toRAW', 'toText', 'isEmpty']
    keys.forEach(key => {
      result[key] = KedaoEditorState.prototype[key].bind(result)
    })
    return result
  }

  static createFrom = (content, options = {}) => {
    const customOptions: any = { ...options }
    customOptions.unitExportFn =
      customOptions.unitExportFn || defaultProps.converts.unitExportFn
    customOptions.styleImportFn = compositeStyleImportFn(
      customOptions.styleImportFn,
      customOptions.editorId
    )
    customOptions.entityImportFn = compositeEntityImportFn(
      customOptions.entityImportFn,
      customOptions.editorId
    )
    customOptions.blockImportFn = compositeBlockImportFn(
      customOptions.blockImportFn,
      customOptions.editorId
    )

    let editorState = null

    if (content instanceof KedaoEditorState) {
      editorState = content
    }
    if (
      typeof content === 'object' &&
      content &&
      content.blocks &&
      content.entityMap
    ) {
      editorState = convertRawToEditorState(
        content,
        getDecorators(customOptions.editorId)
      )
    }
    if (typeof content === 'string') {
      try {
        if (/^(-)?\d+$/.test(content)) {
          editorState = convertHTMLToEditorState(
            content,
            getDecorators(customOptions.editorId),
            customOptions,
            'create'
          )
        } else {
          editorState = KedaoEditorState.createFrom(
            JSON.parse(content),
            customOptions
          )
        }
      } catch (error) {
        editorState = convertHTMLToEditorState(
          content,
          getDecorators(customOptions.editorId),
          customOptions,
          'create'
        )
      }
    }
    if (typeof content === 'number') {
      editorState = convertHTMLToEditorState(
        content.toLocaleString().replace(/,/g, ''),
        getDecorators(customOptions.editorId),
        customOptions,
        'create'
      )
    } else {
      editorState = KedaoEditorState.createEmpty(
        getDecorators(customOptions.editorId)
      )
    }

    customOptions.styleExportFn = compositeStyleExportFn(
      customOptions.styleExportFn,
      customOptions.editorId
    )
    customOptions.entityExportFn = compositeEntityExportFn(
      customOptions.entityExportFn,
      customOptions.editorId
    )
    customOptions.blockExportFn = compositeBlockExportFn(
      customOptions.blockExportFn,
      customOptions.editorId
    )

    editorState.setConvertOptions(customOptions)

    return editorState
  }
}
