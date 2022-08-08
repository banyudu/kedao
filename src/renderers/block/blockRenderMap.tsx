import React from 'react'
import { Map } from 'immutable'
import { DefaultDraftBlockRenderMap, DraftBlockRenderMap } from 'draft-js'

export default (blockRenderMap: DraftBlockRenderMap): DraftBlockRenderMap => {
  let customBlockRenderMap: DraftBlockRenderMap = Map({
    atomic: {
      element: ''
    },
    'code-block': {
      element: 'code',
      wrapper: <pre />
    }
  })

  try {
    if (blockRenderMap) {
      customBlockRenderMap = customBlockRenderMap.merge(blockRenderMap)
    }

    customBlockRenderMap =
      DefaultDraftBlockRenderMap.merge(customBlockRenderMap)
  } catch (error) {
    console.warn(error)
  }

  return customBlockRenderMap
}
