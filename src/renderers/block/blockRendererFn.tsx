import React from 'react'

import Image from '../../components/Image'
import Video from '../../components/Video'
import Audio from '../../components/Audio'
import Embed from '../../components/Embed'
import HorizontalLine from '../../components/HorizontalLine'
import { BlockRenderer, BlockRendererFn, BlockRenderProps, ImageControlItem, Language } from '../../types'
import { ContentBlock, EditorState } from 'draft-js'
import { removeBlock } from '../../utils'

interface GetRenderFnParams extends Omit<BlockRenderProps, 'onRemove' | 'editorState' | 'contentState'> {
  extendAtomics: any[]
  editorId: string
  language: Language
  value: EditorState
  imageEqualRatio: boolean
  onChange: (state: EditorState) => void
  imageResizable: boolean
  readOnly: boolean
  imageControls: readonly ImageControlItem[]
  lock: (locked: boolean) => void
  getContainerNode: () => HTMLDivElement
  refresh: () => void
}

const myGetRenderFn = (superProps: GetRenderFnParams, customBlockRendererFn: BlockRendererFn) =>
  (block: ContentBlock): BlockRenderer => {
    const {
      value,
      onChange,
      extendAtomics,
      language,
      imageEqualRatio,
      readOnly,
      imageResizable,
      imageControls,
      lock,
      getContainerNode,
      refresh
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
        language,
        editorState: value,
        contentState: value.getCurrentContent()
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

    if (blockType === 'atomic') {
      return {
        component: renderAtomicBlock,
        editable: false
      }
    }

    return null
  }

export default myGetRenderFn
