import React from 'react'
import Immutable, { Map } from 'immutable'
import { DefaultDraftBlockRenderMap, DraftBlockRenderMap, ContentBlock, EditorState, DraftStyleMap, CharacterMetadata, CompositeDecorator, ContentState } from 'draft-js'
import Image from '../../components/Image'
import Video from '../../components/Video'
import Audio from '../../components/Audio'
import Embed from '../../components/Embed'
import HorizontalLine from '../../components/HorizontalLine'
import { BlockRenderer, BlockRendererFn, BlockRenderProps, ImageControlItem, Language } from '../../types'
import { removeBlock } from '..'
import CombineDecorators from 'draft-js-multidecorators'
import Link from '../../components/Link'
import { classNameParser } from '../style'
import styles from './style.module.scss'
const cls = classNameParser(styles)

export const getBlockRenderMap = (blockRenderMap: DraftBlockRenderMap): DraftBlockRenderMap => {
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

export const getBlockRendererFn = (superProps: GetRenderFnParams, customBlockRendererFn: BlockRendererFn) =>
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

export const getBlockStyleFn = (customBlockStyleFn) => (block) => {
  const blockAlignment = block.getData() && block.getData().get('textAlign')
  const blockIndent = block.getData() && block.getData().get('textIndent')
  const blockFloat = block.getData() && block.getData().get('float')

  const className = [
    blockAlignment && cls(`kedao-alignment-${blockAlignment}`),
    blockIndent && cls(`kedao-text-indent-${blockIndent}`),
    blockFloat && cls(`kedao-float-${blockFloat}`),
    customBlockStyleFn?.(block)
  ].filter(Boolean).join(' ')

  return className
}

export const getCustomStyleMap = (customStyleMap: DraftStyleMap = {}): DraftStyleMap => {
  return {
    SUPERSCRIPT: {
      position: 'relative',
      top: '-8px',
      fontSize: '11px'
    },
    SUBSCRIPT: {
      position: 'relative',
      bottom: '-8px',
      fontSize: '11px'
    },
    ...customStyleMap
  }
}

const getStyleValue = (style) => style.split('-')[1]

export const getCustomStyleFn = (options) => (styles, block) => {
  let output: any = {}
  const { fontFamilies, unitExportFn, customStyleFn } = options

  output = customStyleFn ? customStyleFn(styles, block, output) : {}

  styles.forEach((style) => {
    if (style.indexOf('COLOR-') === 0) {
      output.color = `#${getStyleValue(style)}`
    } else if (style.indexOf('BGCOLOR-') === 0) {
      output.backgroundColor = `#${getStyleValue(style)}`
    } else if (style.indexOf('FONTSIZE-') === 0) {
      output.fontSize = unitExportFn(
        getStyleValue(style),
        'font-size',
        'editor'
      )
    } else if (style.indexOf('LINEHEIGHT-') === 0) {
      output.lineHeight = unitExportFn(
        getStyleValue(style),
        'line-height',
        'editor'
      )
    } else if (style.indexOf('LETTERSPACING-') === 0) {
      output.letterSpacing = unitExportFn(
        getStyleValue(style),
        'letter-spacing',
        'editor'
      )
    } else if (style.indexOf('TEXTINDENT-') === 0) {
      output.textIndent = unitExportFn(
        getStyleValue(style),
        'text-indent',
        'editor'
      )
    } else if (style.indexOf('FONTFAMILY-') === 0) {
      output.fontFamily =
        (
          fontFamilies.find(
            (item) => item.name.toUpperCase() === getStyleValue(style)
          ) || {}
        ).family || ''
    }
  })

  return output
}

const KEY_SEPARATOR = '-'

CombineDecorators.prototype.getDecorations = function getDecorations (
  block,
  contentState: ContentState
) {
  const decorations = Array(block.getText().length).fill(null)

  this.decorators.forEach((decorator, i) => {
    decorator.getDecorations(block, contentState).forEach((key, offset) => {
      if (!key) {
        return
      }
      decorations[offset] = i + KEY_SEPARATOR + key
    })
  })

  return Immutable.List(decorations)
}

const builtinDecorators = [
  {
    type: 'entity',
    decorator: {
      key: 'LINK',
      component: Link
    }
  }
]

const createStrategy = (type: string) => (block: ContentBlock, callback: (start: number, end: number) => void, contentState: ContentState) => {
  block.findEntityRanges((character: CharacterMetadata) => {
    const entityKey = character.getEntity()
    return (
      entityKey !== null && contentState.getEntity(entityKey).getType() === type
    )
  }, callback)
}

export const getDecorators = () => {
  return new CombineDecorators([
    // combine decorators created with strategy
    new CompositeDecorator([]),
    // combine decorators for entities
    new CompositeDecorator(
      builtinDecorators.map((item) => ({
        strategy: createStrategy(item.decorator.key),
        component: item.decorator.component
      }))
    )
  ])
}
