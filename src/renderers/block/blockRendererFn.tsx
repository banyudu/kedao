import React from 'react'

import Image from '../atomics/Image'
import Video from '../atomics/Video'
import Audio from '../atomics/Audio'
import Embed from '../atomics/Embed'
import HorizontalLine from '../atomics/HorizontalLine'
import { getExtensionBlockRendererFns } from '../../helpers/extension'
import { BlockRendererFn, BlockRenderProps, Hooks, ImageControlItem, Language } from '../../types'
import { ContentBlock, EditorState } from 'draft-js'
import { removeBlock } from '../../utils'

interface GetRenderFnParams extends Omit<BlockRenderProps, 'onRemove'> {
  extendAtomics: any[]
  editorId: string
  language: Language
  value: EditorState
  imageEqualRatio: boolean
  onChange: (state: EditorState) => void
  imageResizable: boolean
  readOnly: boolean
  hooks: Hooks
  imageControls: readonly ImageControlItem[]
  lock: (locked: boolean) => void
  getContainerNode: () => HTMLDivElement
  refresh: () => void
}

const myGetRenderFn = (superProps: GetRenderFnParams, customBlockRendererFn: BlockRendererFn) => (block: ContentBlock) => {
  const {
    value,
    onChange,
    extendAtomics,
    editorId,
    language,
    imageEqualRatio,
    readOnly,
    imageResizable,
    imageControls,
    lock,
    getContainerNode,
    refresh,
    hooks
  } = superProps

  const renderAtomicBlock = ({ contentState }) => {
    const entityKey = block.getEntityAt(0)

    if (!entityKey) {
      return null
    }

    const entity = contentState.getEntity(entityKey)
    const mediaData = entity.getData()
    const mediaType = entity.getType()

    const handleRemove = () => {
      onChange?.(removeBlock(value, block))
    }

    const mediaProps: BlockRenderProps = {
      // block: props.block,
      mediaData,
      // entityKey,
      onRemove: handleRemove,
      language
    }

    if (mediaType === 'IMAGE') {
      return (
        <Image
          {...mediaProps}
          imageEqualRatio={imageEqualRatio}
          entityKey={entityKey}
          readOnly={readOnly}
          block={block}
          imageResizable={imageResizable}
          imageControls={imageControls}
          hooks={hooks}
          lock={lock}
          getContainerNode={getContainerNode}
          value={value}
          onChange={onChange}
          refresh={refresh}
        />
      )
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

    if (extendAtomics) {
      const atomic = extendAtomics.find(item => {
        return item.type === mediaType
      })

      if (atomic) {
        const Component = atomic.component
        return <Component {...mediaProps} />
      }
    }

    return null
  }

  const blockType = block.getType()

  const customRenderer = customBlockRendererFn?.(block, { editorState: value }) ?? null

  if (customRenderer) {
    return customRenderer
  }

  const extensionRender = getExtensionBlockRendererFns(editorId)?.find(item =>
    item.blockType === blockType ||
    (item.blockType instanceof RegExp && item.blockType.test(blockType))
  )?.rendererFn?.({
    value,
    onChange,
    readOnly,
    refresh
  })

  if (extensionRender) {
    return extensionRender
  }

  if (blockType === 'atomic') {
    return {
      component: renderAtomicBlock,
      editable: false
    }
  }

  return null
}

export default myGetRenderFn
