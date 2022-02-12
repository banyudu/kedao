// -extended support for block-style and atomic types

import React from 'react'
import { CompositeDecorator, ContentState, DraftDecorator } from 'draft-js'
import { Extension } from '../types'

const extensionControls: Extension[] = []
const extensionDecorators: Extension[] = []

const propInterceptors: Extension[] = []

const extensionBlockRenderMaps: Extension[] = []
const extensionBlockRendererFns: Extension[] = []

const extensionInlineStyleMaps: Extension[] = []
const extensionInlineStyleFns: Extension[] = []

const extensionEntities: Extension[] = []

const inlineStyleImporters: Extension[] = []
const inlineStyleExporters: Extension[] = []
const blockImporters: Extension[] = []
const blockExporters: Extension[] = []

const filterByEditorId = (items: Extension[], editorId: string): any[] => {
  if (!editorId) {
    return items
      .filter((item) => !item.includeEditors)
      .map((item) => item.data)
  }

  return items
    .map((item) => {
      if (!item.includeEditors && !item.excludeEditors) {
        return item.data
      }

      if (item.includeEditors) {
        return item.includeEditors.includes(editorId) ? item.data : false
      }

      if (item.excludeEditors) {
        return item.excludeEditors.includes(editorId) ? false : item.data
      }

      return false
    })
    .filter((item) => item)
}

export const getPropInterceptors = (editorId: string) =>
  filterByEditorId(propInterceptors, editorId)

export const getExtensionControls = (editorId: string) =>
  filterByEditorId(extensionControls, editorId)

export const getExtensionDecorators = (editorId: string) =>
  filterByEditorId(extensionDecorators, editorId)

export const getExtensionBlockRenderMaps = (editorId: string) =>
  filterByEditorId(extensionBlockRenderMaps, editorId)

export const getExtensionBlockRendererFns = (editorId: string) =>
  filterByEditorId(extensionBlockRendererFns, editorId)

export const getExtensionInlineStyleMap = (editorId: string) => {
  const inlineStyleMap = {}

  filterByEditorId(extensionInlineStyleMaps, editorId).forEach((item) => {
    inlineStyleMap[item.inlineStyleName] = item.styleMap
  })

  return inlineStyleMap
}

export const getExtensionInlineStyleFns = (editorId: string) =>
  filterByEditorId(extensionInlineStyleFns, editorId)

export const compositeStyleImportFn =
  (styleImportFn, editorId: string) => (nodeName, node, style) => {
    filterByEditorId(inlineStyleImporters, editorId).forEach(
      (styleImporter) => {
        if (styleImporter.importer?.(nodeName, node)) {
          style = style.add(styleImporter.inlineStyleName)
        }
      }
    )

    return styleImportFn ? styleImportFn(nodeName, node, style) : style
  }

export const compositeStyleExportFn = (styleExportFn, editorId: string) => (style) => {
  style = style.toUpperCase()
  let result = styleExportFn ? styleExportFn(style) : undefined

  if (result) {
    return result
  }

  filterByEditorId(inlineStyleExporters, editorId).find((item) => {
    if (item.inlineStyleName === style) {
      result = item.exporter
      return true
    }
    return false
  })

  return result
}

export const compositeEntityImportFn =
  (entityImportFn, editorId: string) => (nodeName, node, createEntity, source) => {
    let result = entityImportFn
      ? entityImportFn(nodeName, node, createEntity, source)
      : null

    if (result) {
      return result
    }

    filterByEditorId(extensionEntities, editorId).find((entityItem) => {
      const matched = entityItem.importer
        ? entityItem.importer(nodeName, node, source)
        : null
      if (matched) {
        result = createEntity(
          entityItem.entityType,
          matched.mutability || 'MUTABLE',
          matched.data || {}
        )
      }
      return !!matched
    })

    return result
  }

export const compositeEntityExportFn =
  (entityExportFn, editorId: string) => (entity, originalText) => {
    let result = entityExportFn
      ? entityExportFn(entity, originalText)
      : undefined

    if (result) {
      return result
    }

    const entityType = entity.type.toUpperCase()

    filterByEditorId(extensionEntities, editorId).find((entityItem) => {
      if (entityItem.entityType === entityType) {
        result = entityItem.exporter
          ? entityItem.exporter(entity, originalText)
          : undefined
        return true
      }
      return false
    })

    return result
  }

export const compositeBlockImportFn =
  (blockImportFn, editorId: string) => (nodeName, node, source) => {
    let result = blockImportFn ? blockImportFn(nodeName, node, source) : null

    if (result) {
      return result
    }

    filterByEditorId(blockImporters, editorId).find((blockImporter) => {
      const matched = blockImporter.importer
        ? blockImporter.importer(nodeName, node, source)
        : undefined
      if (matched) {
        result = matched
      }
      return !!matched
    })

    return result
  }

export const compositeBlockExportFn =
  (blockExportFn, editorId: string) => (contentState: ContentState, block) => {
    let result = blockExportFn ? blockExportFn(contentState, block) : null

    if (result) {
      return result
    }

    filterByEditorId(blockExporters, editorId).find((blockExporter) => {
      const matched = blockExporter.exporter
        ? blockExporter.exporter(contentState, block)
        : undefined
      if (matched) {
        result = matched
      }
      return !!matched
    })

    return result
  }

export const useExtension = (extension: Extension) => {
  if (extension instanceof Array) {
    extension.forEach(useExtension)
    return false
  }

  if (!extension || !extension.type || typeof extension.type !== 'string') {
    return false
  }

  const { includeEditors, excludeEditors } = extension

  if (extension.type === 'control') {
    extensionControls.push({
      includeEditors,
      excludeEditors,
      data: extension.control
    })
  } else if (extension.type === 'inline-style') {
    const inlineStyleName = extension.name.toUpperCase()

    if (extension.control) {
      extensionControls.push({
        includeEditors,
        excludeEditors,
        data: {
          key: inlineStyleName,
          type: 'inline-style',
          command: inlineStyleName,
          ...extension.control
        }
      })
    }

    if (extension.style) {
      extensionInlineStyleMaps.push({
        includeEditors,
        excludeEditors,
        data: {
          inlineStyleName,
          styleMap: extension.style
        }
      })
    }

    if (extension.styleFn) {
      extensionInlineStyleFns.push({
        includeEditors,
        excludeEditors,
        data: {
          inlineStyleName,
          styleFn: extension.styleFn
        }
      })
    }

    if (extension.importer) {
      inlineStyleImporters.push({
        includeEditors,
        excludeEditors,
        data: {
          inlineStyleName,
          importer: extension.importer
        }
      })
    }

    inlineStyleExporters.push({
      includeEditors,
      excludeEditors,
      data: {
        inlineStyleName,
        exporter: extension.exporter
          ? (
              extension.exporter(extension)
            )
          : (
          <span style={extension.style} />
            )
      }
    })
  } else if (extension.type === 'block-style') {
    // TODO
  } else if (extension.type === 'entity') {
    const entityType = extension.name.toUpperCase()

    if (extension.control) {
      extensionControls.push({
        includeEditors,
        excludeEditors,
        data: {
          ...(typeof extension.control === 'function' && {
            key: entityType,
            type: 'entity',
            command: entityType,
            data: {
              mutability: extension.mutability || 'MUTABLE',
              data: extension.data || {}
            },
            ...extension.control
          })
        }
      })
    }

    extensionEntities.push({
      includeEditors,
      excludeEditors,
      data: {
        entityType,
        importer: extension.importer,
        exporter: extension.exporter
      }
    })

    extensionDecorators.push({
      includeEditors,
      excludeEditors,
      data: {
        type: 'entity',
        decorator: {
          key: entityType,
          component: extension.component
        }
      }
    })
  } else if (extension.type === 'block') {
    const blockType = extension.name

    if (extension.renderMap) {
      extensionBlockRenderMaps.push({
        includeEditors,
        excludeEditors,
        data: {
          blockType,
          renderMap: extension.renderMap
        }
      })
    }

    if (extension.rendererFn) {
      extensionBlockRendererFns.push({
        includeEditors,
        excludeEditors,
        data: {
          blockType,
          rendererFn: extension.rendererFn
        }
      })
    }

    if (extension.importer) {
      blockImporters.push({
        includeEditors,
        excludeEditors,
        data: {
          blockType,
          importer: extension.importer
        }
      })
    }

    if (extension.exporter) {
      blockExporters.push({
        includeEditors,
        excludeEditors,
        data: {
          blockType,
          exporter: extension.exporter
        }
      })
    }
  } else if (extension.type === 'atomic') {
    // TODO
  } else if (extension.type === 'decorator') {
    const { decorator } = extension

    if ((decorator as DraftDecorator)?.strategy && (decorator as DraftDecorator).component) {
      extensionDecorators.push({
        includeEditors,
        excludeEditors,
        data: {
          type: 'strategy',
          decorator
        }
      })
    } else if ((decorator as CompositeDecorator)?.getDecorations) {
      extensionDecorators.push({
        includeEditors,
        excludeEditors,
        data: {
          type: 'class',
          decorator
        }
      })
    }
  } else if (extension.type === 'prop-interception') {
    propInterceptors.push({
      includeEditors,
      excludeEditors,
      data: extension.interceptor
    })
  }
  return true
}
