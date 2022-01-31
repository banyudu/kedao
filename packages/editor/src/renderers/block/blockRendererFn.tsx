import React from 'react'

import Image from '../atomics/Image'
import Video from '../atomics/Video'
import Audio from '../atomics/Audio'
import Embed from '../atomics/Embed'
import HorizontalLine from '../atomics/HorizontalLine'
import { getExtensionBlockRendererFns } from '../../helpers/extension'

class BlockRenderFnContext {
  superProps;

  customBlockRendererFn;

  getRenderFn = (superProps, customBlockRendererFn) => {
    this.superProps = superProps
    this.customBlockRendererFn = customBlockRendererFn

    return this.blockRendererFn
  };

  renderAtomicBlock = (props) => {
    const { superProps } = this

    const entityKey = props.block.getEntityAt(0)

    if (!entityKey) {
      return null
    }

    const entity = props.contentState.getEntity(entityKey)
    const mediaData = entity.getData()
    const mediaType = entity.getType()
    const mediaProps = {
      ...superProps,
      block: props.block,
      mediaData,
      entityKey
    }

    if (mediaType === 'IMAGE') {
      return <Image {...mediaProps} />
    }
    if (mediaType === 'AUDIO') {
      return <Audio {...mediaProps} />
    }
    if (mediaType === 'VIDEO') {
      return <Video {...mediaProps} />
    }
    if (mediaType === 'EMBED') {
      return <Embed {...mediaProps} />
    }
    if (mediaType === 'HR') {
      return <HorizontalLine {...mediaProps} />
    }

    if (superProps.extendAtomics) {
      const atomics = superProps.extendAtomics
      for (let i = 0; i < atomics.length; i++) {
        if (mediaType === atomics[i].type) {
          const Component = atomics[i].component
          return <Component {...mediaProps} />
        }
      }
    }

    return null
  };

  blockRendererFn = (block) => {
    const { customBlockRendererFn, superProps } = this

    const blockType = block.getType()
    let blockRenderer = null

    if (customBlockRendererFn) {
      blockRenderer = customBlockRendererFn(block, superProps) || null
    }

    if (blockRenderer) {
      return blockRenderer
    }

    const extensionBlockRendererFns = getExtensionBlockRendererFns(
      superProps.editorId
    )

    extensionBlockRendererFns.find((item) => {
      if (
        item.blockType === blockType ||
        (item.blockType instanceof RegExp && item.blockType.test(blockType))
      ) {
        blockRenderer = item.rendererFn ? item.rendererFn(superProps) : null
        return true
      }
      return false
    })

    if (blockRenderer) {
      return blockRenderer
    }

    if (blockType === 'atomic') {
      blockRenderer = {
        component: this.renderAtomicBlock,
        editable: false
      }
    }

    return blockRenderer
  };
}

const blockRenderFnContext = new BlockRenderFnContext()
export default blockRenderFnContext.getRenderFn
