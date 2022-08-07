import React from 'react'
import { Map } from 'immutable'
import { DefaultDraftBlockRenderMap } from 'draft-js'

export default (props, blockRenderMap) => {
  let customBlockRenderMap = Map({
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
      if (typeof blockRenderMap === 'function') {
        customBlockRenderMap = customBlockRenderMap.merge(
          blockRenderMap(props)
        )
      } else {
        customBlockRenderMap = customBlockRenderMap.merge(blockRenderMap)
      }
    }

    customBlockRenderMap =
      DefaultDraftBlockRenderMap.merge(customBlockRenderMap)
  } catch (error) {
    console.warn(error)
  }

  return customBlockRenderMap
}
