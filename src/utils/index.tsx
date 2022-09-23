/* eslint-disable react/display-name */

import React, { CSSProperties, KeyboardEvent } from 'react'
import {
  Modifier,
  EditorState,
  RawDraftContentState,
  SelectionState,
  RichUtils,
  CharacterMetadata,
  AtomicBlockUtils,
  convertFromRaw,
  ContentBlock,
  DraftInlineStyle,
  ContentState,
  convertToRaw,
  KeyBindingUtil
} from 'draft-js'
import Immutable from 'immutable'
import { ConvertOptions, Position } from '../types'
import { namedColors, defaultFontFamilies } from '../constants'
import { convertToHTML, convertFromHTML } from 'draft-convert'

const strictBlockTypes = ['atomic']

export const registerStrictBlockType = (blockType: string) => {
  !strictBlockTypes.includes(blockType) && strictBlockTypes.push(blockType)
}

export const selectionContainsBlockType = (
  editorState: EditorState,
  blockType: string
) => {
  return getSelectedBlocks(editorState).find(
    (block) => block.getType() === blockType
  )
}

export const selectionContainsStrictBlock = (editorState: EditorState) => {
  return getSelectedBlocks(editorState).find(
    (block) => ~strictBlockTypes.indexOf(block.getType())
  )
}

export const selectBlock = (editorState: EditorState, block: ContentBlock) => {
  const blockKey = block.getKey()

  return EditorState.forceSelection(
    editorState,
    new SelectionState({
      anchorKey: blockKey,
      anchorOffset: 0,
      focusKey: blockKey,
      focusOffset: block.getLength()
    })
  )
}

export const selectNextBlock = (
  editorState: EditorState,
  block: ContentBlock
) => {
  const nextBlock = editorState
    .getCurrentContent()
    .getBlockAfter(block.getKey())
  return nextBlock ? selectBlock(editorState, nextBlock) : editorState
}

export const removeBlock = (
  editorState: EditorState,
  block: ContentBlock,
  lastSelection: SelectionState | null = null
) => {
  let nextContentState: ContentState
  const blockKey = block.getKey()

  nextContentState = Modifier.removeRange(
    editorState.getCurrentContent(),
    new SelectionState({
      anchorKey: blockKey,
      anchorOffset: 0,
      focusKey: blockKey,
      focusOffset: block.getLength()
    }),
    'backward'
  )

  nextContentState = Modifier.setBlockType(
    nextContentState,
    nextContentState.getSelectionAfter(),
    'unstyled'
  )
  const nextEditorState = EditorState.push(
    editorState,
    nextContentState,
    'remove-range'
  )
  return EditorState.forceSelection(
    nextEditorState,
    lastSelection || nextContentState.getSelectionAfter()
  )
}

export const getSelectionBlock = (editorState: EditorState) => {
  return editorState
    .getCurrentContent()
    .getBlockForKey(editorState.getSelection().getAnchorKey())
}

export const updateEachCharacterOfSelection = (
  editorState: EditorState,

  // TODO: check type of character
  callback: (character: any) => any
) => {
  const selectionState = editorState.getSelection()
  const contentState = editorState.getCurrentContent()
  const contentBlocks = contentState.getBlockMap()
  const selectedBlocks = getSelectedBlocks(editorState)

  if (selectedBlocks.length === 0) {
    return editorState
  }

  const startKey = selectionState.getStartKey()
  const startOffset = selectionState.getStartOffset()
  const endKey = selectionState.getEndKey()
  const endOffset = selectionState.getEndOffset()

  const nextContentBlocks = contentBlocks.map((block) => {
    if (!selectedBlocks.includes(block)) {
      return block
    }

    const blockKey = block.getKey()
    const charactersList = block.getCharacterList()
    let nextCharactersList: typeof charactersList | null = null

    if (blockKey === startKey && blockKey === endKey) {
      nextCharactersList = charactersList
        .map((character, index) => {
          if (index >= startOffset && index < endOffset) {
            return callback(character)
          }
          return character
        })
        .toList()
    } else if (blockKey === startKey) {
      nextCharactersList = charactersList
        .map((character, index) => {
          if (index >= startOffset) {
            return callback(character)
          }
          return character
        })
        .toList()
    } else if (blockKey === endKey) {
      nextCharactersList = charactersList
        .map((character, index) => {
          if (index < endOffset) {
            return callback(character)
          }
          return character
        })
        .toList()
    } else {
      nextCharactersList = charactersList
        .map((character) => {
          return callback(character)
        })
        .toList()
    }

    return block.merge({
      characterList: nextCharactersList
    })
  })

  return EditorState.push(
    editorState,
    contentState.merge({
      blockMap: nextContentBlocks,
      selectionBefore: selectionState,
      selectionAfter: selectionState
    }) as any,
    'update-selection-character-list' as any
  )
}

export const getSelectedBlock = (editorState: EditorState) => {
  const selectionState = editorState.getSelection()
  const contentState = editorState.getCurrentContent()

  const startKey = selectionState.getStartKey()
  const startingBlock = contentState.getBlockForKey(startKey)
  return startingBlock
}

export const getSelectedBlocks = (editorState: EditorState) => {
  const selectionState = editorState.getSelection()
  const contentState = editorState.getCurrentContent()

  const startKey = selectionState.getStartKey()
  const endKey = selectionState.getEndKey()
  const isSameBlock = startKey === endKey
  const startingBlock = contentState.getBlockForKey(startKey)
  const selectedBlocks = [startingBlock]

  if (!isSameBlock) {
    let blockKey = startKey

    while (blockKey !== endKey) {
      const nextBlock = contentState.getBlockAfter(blockKey)
      if (nextBlock) {
        selectedBlocks.push(nextBlock)
        blockKey = nextBlock.getKey()
      }
    }
  }

  return selectedBlocks
}

export const setSelectionBlockData = (
  editorState: EditorState,
  blockData,
  override = false
) => {
  const newBlockData = override
    ? blockData
    : Object.assign({}, getSelectionBlockData(editorState).toJS(), blockData)

  Object.keys(newBlockData).forEach((key) => {
    // eslint-disable-next-line no-prototype-builtins
    if (newBlockData.hasOwnProperty(key) && newBlockData[key] === undefined) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete newBlockData[key]
    }
  })

  return setBlockData(editorState, newBlockData)
}

export const getSelectionBlockData = (
  editorState: EditorState,
  name?: string
): any => {
  const blockData = getSelectionBlock(editorState).getData()
  return name ? blockData.get(name) : blockData
}

export const getSelectionBlockType = (editorState: EditorState) => {
  return getSelectionBlock(editorState).getType()
}

export const getSelectionText = (editorState: EditorState) => {
  const selectionState = editorState.getSelection()
  const contentState = editorState.getCurrentContent()

  if (
    selectionState.isCollapsed() ||
    getSelectionBlockType(editorState) === 'atomic'
  ) {
    return ''
  }

  const anchorKey = selectionState.getAnchorKey()
  const currentContentBlock = contentState.getBlockForKey(anchorKey)
  const start = selectionState.getStartOffset()
  const end = selectionState.getEndOffset()

  return currentContentBlock.getText().slice(start, end)
}

export const toggleSelectionBlockType = (
  editorState: EditorState,
  blockType: string
) => {
  if (selectionContainsStrictBlock(editorState)) {
    return editorState
  }

  return RichUtils.toggleBlockType(editorState, blockType)
}

export const getSelectionEntityType = (editorState: EditorState) => {
  const entityKey = getSelectionEntity(editorState)

  if (entityKey) {
    const entity = editorState.getCurrentContent().getEntity(entityKey)
    return entity ? entity.getType() : null
  }

  return null
}

export const getSelectionEntityData = (
  editorState: EditorState,
  type: string
) => {
  const entityKey = getSelectionEntity(editorState)

  if (entityKey) {
    const entity = editorState.getCurrentContent().getEntity(entityKey)
    if (entity && entity.getType() === type) {
      return entity.getData()
    } else {
      return {}
    }
  } else {
    return {}
  }
}

export const toggleSelectionEntity = (editorState: EditorState, entity) => {
  const contentState = editorState.getCurrentContent()
  const selectionState = editorState.getSelection()

  if (
    selectionState.isCollapsed() ||
    getSelectionBlockType(editorState) === 'atomic'
  ) {
    return editorState
  }

  if (
    !entity ||
    !entity.type ||
    getSelectionEntityType(editorState) === entity.type
  ) {
    return EditorState.push(
      editorState,
      Modifier.applyEntity(contentState, selectionState, null),
      'apply-entity'
    )
  }

  try {
    const nextContentState = contentState.createEntity(
      entity.type,
      entity.mutability,
      entity.data
    )
    const entityKey = nextContentState.getLastCreatedEntityKey()

    const nextEditorState = EditorState.set(editorState, {
      currentContent: nextContentState
    })

    return EditorState.push(
      nextEditorState,
      Modifier.applyEntity(nextContentState, selectionState, entityKey),
      'apply-entity'
    )
  } catch (error) {
    console.warn(error)
    return editorState
  }
}

export const toggleSelectionLink = (
  editorState: EditorState,
  href,
  target?
) => {
  const contentState = editorState.getCurrentContent()
  const selectionState = editorState.getSelection()

  const entityData = { href, target }

  if (
    selectionState.isCollapsed() ||
    getSelectionBlockType(editorState) === 'atomic'
  ) {
    return editorState
  }

  if (href === false) {
    return RichUtils.toggleLink(editorState, selectionState, null)
  }

  if (href === null) {
    delete entityData.href
  }

  try {
    const nextContentState = contentState.createEntity(
      'LINK',
      'MUTABLE',
      entityData
    )
    const entityKey = nextContentState.getLastCreatedEntityKey()

    let nextEditorState = EditorState.set(editorState, {
      currentContent: nextContentState
    })

    nextEditorState = RichUtils.toggleLink(
      nextEditorState,
      selectionState,
      entityKey
    )
    nextEditorState = EditorState.forceSelection(
      nextEditorState,
      selectionState.merge({
        anchorOffset: selectionState.getEndOffset(),
        focusOffset: selectionState.getEndOffset()
      })
    )

    nextEditorState = EditorState.push(
      nextEditorState,
      Modifier.insertText(
        nextEditorState.getCurrentContent(),
        nextEditorState.getSelection(),
        ''
      ),
      'insert-text' as any
    )

    return nextEditorState
  } catch (error) {
    console.warn(error)
    return editorState
  }
}

export const getSelectionInlineStyle = (editorState: EditorState) => {
  return editorState.getCurrentInlineStyle()
}

export const selectionHasInlineStyle = (
  editorState: EditorState,
  style: string
) => {
  return getSelectionInlineStyle(editorState).has(style.toUpperCase())
}

export const toggleSelectionInlineStyle = (
  editorState: EditorState,
  style: string,
  prefix: string = ''
) => {
  let nextEditorState = editorState
  style = prefix + style.toUpperCase()

  if (prefix) {
    nextEditorState = updateEachCharacterOfSelection(
      nextEditorState,
      (characterMetadata) => {
        return characterMetadata
          .toJS()
          .style.reduce((characterMetadata, characterStyle) => {
            if (
              characterStyle.indexOf(prefix) === 0 &&
              style !== characterStyle
            ) {
              return CharacterMetadata.removeStyle(
                characterMetadata,
                characterStyle
              )
            } else {
              return characterMetadata
            }
          }, characterMetadata)
      }
    )
  }

  return RichUtils.toggleInlineStyle(nextEditorState, style)
}

export const removeSelectionInlineStyles = (editorState: EditorState) => {
  return updateEachCharacterOfSelection(editorState, (characterMetadata) => {
    return characterMetadata.merge({
      style: Immutable.OrderedSet([])
    })
  })
}

export const toggleSelectionAlignment = (
  editorState: EditorState,
  alignment
) => {
  return setSelectionBlockData(editorState, {
    textAlign:
      getSelectionBlockData(editorState, 'textAlign') !== alignment
        ? alignment
        : undefined
  })
}

export const toggleSelectionIndent = (
  editorState: EditorState,
  textIndent,
  maxIndent = 6
) => {
  return textIndent < 0 || textIndent > maxIndent || isNaN(textIndent)
    ? editorState
    : setSelectionBlockData(editorState, {
      textIndent: textIndent || undefined
    })
}

export const increaseSelectionIndent = (
  editorState: EditorState,
  maxIndent = 6
) => {
  const currentIndent: number =
    getSelectionBlockData(editorState, 'textIndent') || 0
  return toggleSelectionIndent(editorState, currentIndent + 1, maxIndent)
}

export const decreaseSelectionIndent = (
  editorState: EditorState,
  maxIndent?
) => {
  const currentIndent = getSelectionBlockData(editorState, 'textIndent') || 0
  return toggleSelectionIndent(editorState, currentIndent - 1, maxIndent)
}

export const toggleSelectionColor = (editorState: EditorState, color) => {
  return toggleSelectionInlineStyle(
    editorState,
    color.replace('#', ''),
    'COLOR-'
  )
}

export const toggleSelectionBackgroundColor = (
  editorState: EditorState,
  color: string
) => {
  return toggleSelectionInlineStyle(
    editorState,
    color.replace('#', ''),
    'BGCOLOR-'
  )
}

export const toggleSelectionFontSize = (editorState: EditorState, fontSize) => {
  return toggleSelectionInlineStyle(editorState, fontSize, 'FONTSIZE-')
}

export const toggleSelectionLineHeight = (
  editorState: EditorState,
  lineHeight
) => {
  return toggleSelectionInlineStyle(editorState, lineHeight, 'LINEHEIGHT-')
}

export const toggleSelectionFontFamily = (
  editorState: EditorState,
  fontFamily
) => {
  return toggleSelectionInlineStyle(editorState, fontFamily, 'FONTFAMILY-')
}

export const toggleSelectionLetterSpacing = (
  editorState: EditorState,
  letterSpacing: string
) => {
  return toggleSelectionInlineStyle(
    editorState,
    letterSpacing,
    'LETTERSPACING-'
  )
}

export const insertText = (
  editorState: EditorState,
  text: string,
  inlineStyle?: DraftInlineStyle,
  entity?
) => {
  const selectionState = editorState.getSelection()
  const currentSelectedBlockType = getSelectionBlockType(editorState)

  if (currentSelectedBlockType === 'atomic') {
    return editorState
  }

  let entityKey
  let contentState = editorState.getCurrentContent()

  if (entity?.type) {
    contentState = contentState.createEntity(
      entity.type,
      entity.mutability || 'MUTABLE',
      // entity.data || entityData
      entity.data
    )
    entityKey = contentState.getLastCreatedEntityKey()
  }

  if (!selectionState.isCollapsed()) {
    return EditorState.push(
      editorState,
      Modifier.replaceText(
        contentState,
        selectionState,
        text,
        inlineStyle,
        entityKey
      ),
      'replace-text' as any
    )
  } else {
    return EditorState.push(
      editorState,
      Modifier.insertText(
        contentState,
        selectionState,
        text,
        inlineStyle,
        entityKey
      ),
      'insert-text' as any
    )
  }
}

export const insertHTML = (
  editorState: EditorState,
  options: ConvertOptions,
  htmlString: string,
  source: string
) => {
  if (!htmlString) {
    return editorState
  }

  const selectionState = editorState.getSelection()
  const contentState = editorState.getCurrentContent()

  try {
    const { blockMap } = convertFromRaw(
      convertHTMLToRaw(htmlString, options, source) as any
    ) as any

    return EditorState.push(
      editorState,
      Modifier.replaceWithFragment(contentState, selectionState, blockMap),
      'insert-fragment'
    )
  } catch (error) {
    console.warn(error)
    return editorState
  }
}

export const insertAtomicBlock = (
  editorState: EditorState,
  type: string,
  immutable = true,
  data = {}
) => {
  if (selectionContainsStrictBlock(editorState)) {
    return insertAtomicBlock(
      selectNextBlock(editorState, getSelectionBlock(editorState)),
      type,
      immutable,
      data
    )
  }

  const selectionState = editorState.getSelection()
  const contentState = editorState.getCurrentContent()

  if (
    !selectionState.isCollapsed() ||
    getSelectionBlockType(editorState) === 'atomic'
  ) {
    return editorState
  }

  const contentStateWithEntity = contentState.createEntity(
    type,
    immutable ? 'IMMUTABLE' : 'MUTABLE',
    data
  )
  const entityKey = contentStateWithEntity.getLastCreatedEntityKey()
  const newEditorState = AtomicBlockUtils.insertAtomicBlock(
    editorState,
    entityKey,
    ' '
  )

  return newEditorState
}

export const insertHorizontalLine = (editorState: EditorState) => {
  return insertAtomicBlock(editorState, 'HR')
}

export const insertMedias = (
  editorState: EditorState,
  medias = []
): EditorState => {
  if (!medias.length) {
    return editorState
  }

  return medias.reduce((editorState: EditorState, media) => {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { url, link, link_target, name, type, width, height, meta } = media
    return insertAtomicBlock(editorState, type, true, {
      url,
      link,
      link_target,
      name,
      type,
      width,
      height,
      meta
    })
  }, editorState)
}

export const setMediaData = (
  editorState: EditorState,
  entityKey: string,
  data: Record<string, any>
): EditorState => {
  return EditorState.push(
    editorState,
    editorState.getCurrentContent().mergeEntityData(entityKey, data),
    'change-block-data'
  )
}

export const removeMedia = (
  editorState: EditorState,
  mediaBlock: ContentBlock
) => {
  return removeBlock(editorState, mediaBlock)
}

export const setMediaPosition = (
  editorState: EditorState,

  // TODO: check type
  mediaBlock,
  position: Position
) => {
  const newPosition: Position = {}
  const { float, alignment } = position

  if (typeof float !== 'undefined') {
    newPosition.float =
      mediaBlock.getData().get('float') === float ? null : float
  }

  if (typeof alignment !== 'undefined') {
    newPosition.alignment =
      mediaBlock.getData().get('alignment') === alignment ? null : alignment
  }

  return setSelectionBlockData(
    selectBlock(editorState, mediaBlock),
    newPosition
  )
}

export const clear = (editorState: EditorState) => {
  const contentState = editorState.getCurrentContent()

  const firstBlock = contentState.getFirstBlock()
  const lastBlock = contentState.getLastBlock()

  const allSelected = new SelectionState({
    anchorKey: firstBlock.getKey(),
    anchorOffset: 0,
    focusKey: lastBlock.getKey(),
    focusOffset: lastBlock.getLength(),
    hasFocus: true
  })

  return RichUtils.toggleBlockType(
    EditorState.push(
      editorState,
      Modifier.removeRange(contentState, allSelected, 'backward'),
      'remove-range'
    ),
    'unstyled'
  )
}

export const handleKeyCommand = (editorState: EditorState, command: string) => {
  return RichUtils.handleKeyCommand(editorState, command)
}

export const undo = (editorState: EditorState) => {
  return EditorState.undo(editorState)
}

export const redo = (editorState: EditorState) => {
  return EditorState.redo(editorState)
}

let uniqueIndex = 0

export const UniqueIndex = () => {
  uniqueIndex += 1
  return uniqueIndex
}

export const getHexColor = (color: string) => {
  color = color.replace('color:', '').replace(';', '').replace(' ', '')

  if (/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(color)) {
    return color
  } else if (namedColors[color]) {
    return namedColors[color]
  } else if (color.indexOf('rgb') === 0) {
    const rgbArray = color.split(',')
    const convertedColor =
      rgbArray.length < 3
        ? null
        : '#' +
          [rgbArray[0], rgbArray[1], rgbArray[2]]
            .map((x) => {
              const hex = parseInt(x.replace(/\D/g, ''), 10).toString(16)
              return hex.length === 1 ? '0' + hex : hex
            })
            .join('')

    return /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(convertedColor)
      ? convertedColor
      : null
  } else {
    return null
  }
}

export const detectColorsFromHTMLString = (html: string) => {
  return typeof html !== 'string'
    ? []
    : (html.match(/color:[^;]{3,24};/g) || [])
        .map(getHexColor)
        .filter((color) => color)
}

export const detectColorsFromDraftState = (
  draftState: RawDraftContentState
) => {
  const result = []

  if (!draftState || !draftState.blocks || !draftState.blocks.length) {
    return result
  }

  draftState.blocks.forEach((block) => {
    if (block?.inlineStyleRanges?.length) {
      block.inlineStyleRanges.forEach((inlineStyle) => {
        if (inlineStyle.style?.includes('COLOR-')) {
          result.push('#' + inlineStyle.style.split('COLOR-')[1])
        }
      })
    }
  })

  return result.filter((color) => color)
}

/**
 * Function will handle followind keyPress scenario:
 * case Shift+Enter, select not collapsed ->
 *   selected text will be removed and line break will be inserted.
 * Credit: https://github.com/jpuri/draftjs-utils/blob/9e96939aa4a41bb89ad57f8c71c6a8c27efb76f8/js/block.js
 */
export function addLineBreakRemovingSelection (editorState: EditorState) {
  const content = editorState.getCurrentContent()
  const selection = editorState.getSelection()
  let newContent = Modifier.removeRange(content, selection, 'forward')
  const fragment = newContent.getSelectionAfter()
  const block = newContent.getBlockForKey(fragment.getStartKey())
  newContent = Modifier.insertText(
    newContent,
    fragment,
    '\n',
    block.getInlineStyleAt(fragment.getStartOffset()),
    null
  )
  return EditorState.push(editorState, newContent, 'insert-fragment')
}

/**
 * This function will return the entity applicable to whole of current selection.
 * An entity can not span multiple blocks.
 * Credit: https://github.com/jpuri/draftjs-utils/blob/9e96939aa4a41bb89ad57f8c71c6a8c27efb76f8/js/inline.js
 */
export const getSelectionEntity = (editorState: EditorState) => {
  let entity
  const selection = editorState.getSelection()
  let start = selection.getStartOffset()
  let end = selection.getEndOffset()
  if (start === end && start === 0) {
    end = 1
  } else if (start === end) {
    start -= 1
  }
  const block = getSelectedBlock(editorState)

  for (let i = start; i < end; i += 1) {
    const currentEntity = block.getEntityAt(i)
    if (!currentEntity) {
      entity = undefined
      break
    }
    if (i === start) {
      entity = currentEntity
    } else if (entity !== currentEntity) {
      entity = undefined
      break
    }
  }
  return entity
}

/**
 * Function will add block level meta-data.
 * Credit: https://github.com/jpuri/draftjs-utils/blob/9e96939aa4a41bb89ad57f8c71c6a8c27efb76f8/js/block.js
 */
export const setBlockData = (
  editorState: EditorState,
  data: Immutable.Map<any, any>
) => {
  const newContentState = Modifier.setBlockData(
    editorState.getCurrentContent(),
    editorState.getSelection(),
    data
  )
  return EditorState.push(editorState, newContentState, 'change-block-data')
}

/**
 * The function will handle keypress 'Enter' in editor. Following are the scenarios:
 *
 * 1. Shift+Enter, Selection Collapsed -> line break will be inserted.
 * 2. Shift+Enter, Selection not Collapsed ->
 *      selected text will be removed and line break will be inserted.
 * 3. Enter, Selection Collapsed ->
 *      if current block is of type list and length of block is 0
 *      a new list block of depth less that current one will be inserted.
 * 4. Enter, Selection Collapsed ->
 *      if current block not of type list, a new unstyled block will be inserted.
 * Credit: https://github.com/jpuri/draftjs-utils/blob/9e96939aa4a41bb89ad57f8c71c6a8c27efb76f8/js/keyPress.js
 */
export const handleNewLine = (
  editorState: EditorState,
  event: KeyboardEvent<{}>
) => {
  if (KeyBindingUtil.isSoftNewlineEvent(event)) {
    const selection = editorState.getSelection()
    if (selection.isCollapsed()) {
      return RichUtils.insertSoftNewline(editorState)
    }
    return addLineBreakRemovingSelection(editorState)
  }
  return handleHardNewlineEvent(editorState)
}

/**
 * Function to check if a block is of type list.
 * Credit: https://github.com/jpuri/draftjs-utils/blob/9e96939aa4a41bb89ad57f8c71c6a8c27efb76f8/js/list.js
 */
export function isListBlock (block: ContentBlock) {
  if (block) {
    const blockType = block.getType()
    return (
      blockType === 'unordered-list-item' || blockType === 'ordered-list-item'
    )
  }
  return false
}

/**
 * Function to change depth of block(s).
 * Credit: https://github.com/jpuri/draftjs-utils/blob/9e96939aa4a41bb89ad57f8c71c6a8c27efb76f8/js/list.js
 */
const changeBlocksDepth = (
  editorState: EditorState,
  adjustment: number,
  maxDepth: number
): ContentState => {
  const selectionState = editorState.getSelection()
  const contentState = editorState.getCurrentContent()
  let blockMap = contentState.getBlockMap()
  const blocks = getSelectedBlocks(editorState).map((block) => {
    let depth = block.getDepth() + adjustment
    depth = Math.max(0, Math.min(depth, maxDepth))
    return block.set('depth', depth)
  })
  blockMap = blockMap.merge(...blocks)
  return contentState.merge({
    blockMap,
    selectionBefore: selectionState,
    selectionAfter: selectionState
  }) as ContentState
}

/**
 * Function will check various conditions for changing depth and will accordingly
 * either call function changeBlocksDepth or just return the call.
 * Credit: https://github.com/jpuri/draftjs-utils/blob/9e96939aa4a41bb89ad57f8c71c6a8c27efb76f8/js/list.js
 */
const changeDepth = (
  editorState: EditorState,
  adjustment: number,
  maxDepth: number
) => {
  const selection = editorState.getSelection()
  let key
  if (selection.getIsBackward()) {
    key = selection.getFocusKey()
  } else {
    key = selection.getAnchorKey()
  }
  const content = editorState.getCurrentContent()
  const block = content.getBlockForKey(key)
  const type = block.getType()
  if (type !== 'unordered-list-item' && type !== 'ordered-list-item') {
    return editorState
  }
  const blockAbove = content.getBlockBefore(key)
  if (!blockAbove) {
    return editorState
  }
  const typeAbove = blockAbove.getType()
  if (typeAbove !== type) {
    return editorState
  }
  const depth = block.getDepth()
  if (adjustment === 1 && depth === maxDepth) {
    return editorState
  }
  const adjustedMaxDepth = Math.min(blockAbove.getDepth() + 1, maxDepth)
  const withAdjustment = changeBlocksDepth(
    editorState,
    adjustment,
    adjustedMaxDepth
  )
  return EditorState.push(editorState, withAdjustment, 'adjust-depth')
}

/**
 * Function will handle followind keyPress scenarios when Shift key is not pressed.
 * Credit: https://github.com/jpuri/draftjs-utils/blob/9e96939aa4a41bb89ad57f8c71c6a8c27efb76f8/js/keyPress.js
 */
const handleHardNewlineEvent = (editorState: EditorState) => {
  const selection = editorState.getSelection()
  if (selection.isCollapsed()) {
    const contentState = editorState.getCurrentContent()
    const blockKey = selection.getStartKey()
    const block = contentState.getBlockForKey(blockKey)
    if (
      !isListBlock(block) &&
      block.getType() !== 'unstyled' &&
      block.getLength() === selection.getStartOffset()
    ) {
      return insertNewUnstyledBlock(editorState)
    }
    if (isListBlock(block) && block.getLength() === 0) {
      const depth = block.getDepth()
      if (depth === 0) {
        return removeSelectedBlocksStyle(editorState)
      }
      if (depth > 0) {
        return changeDepth(editorState, -1, depth)
      }
    }
  }
  return undefined
}

/**
 * Function will inset a new unstyled block.
 * Credit: https://github.com/jpuri/draftjs-utils/blob/9e96939aa4a41bb89ad57f8c71c6a8c27efb76f8/js/block.js
 */
const insertNewUnstyledBlock = (editorState: EditorState) => {
  const newContentState = Modifier.splitBlock(
    editorState.getCurrentContent(),
    editorState.getSelection()
  )
  const newEditorState = EditorState.push(
    editorState,
    newContentState,
    'split-block'
  )
  return removeSelectedBlocksStyle(newEditorState)
}

/**
 * Function will change block style to unstyled for selected blocks.
 * RichUtils.tryToRemoveBlockStyle does not workd for blocks of length greater than 1.
 * Credit: https://github.com/jpuri/draftjs-utils/blob/9e96939aa4a41bb89ad57f8c71c6a8c27efb76f8/js/block.js
 */
const removeSelectedBlocksStyle = (editorState: EditorState) => {
  const newContentState = RichUtils.tryToRemoveBlockStyle(editorState)
  if (newContentState) {
    return EditorState.push(editorState, newContentState, 'change-block-type')
  }
  return editorState
}

export const compressImage = async (url, width = 1280, height = 800) => {
  return await new Promise((resolve, reject) => {
    const image = new Image()

    image.src = url

    image.onerror = function (error) {
      reject(error)
    }

    image.onload = function (this: HTMLImageElement) {
      try {
        const compressCanvas = document.createElement('canvas')
        const scale =
          this.width > width || this.height > height
            ? this.width > this.height
              ? width / this.width
              : height / this.height
            : 1

        compressCanvas.width = this.width * scale
        compressCanvas.height = this.height * scale

        const canvasContext = compressCanvas.getContext('2d')
        canvasContext.drawImage(
          this,
          0,
          0,
          compressCanvas.width,
          compressCanvas.height
        )

        resolve({
          url: compressCanvas.toDataURL('image/png', 1),
          width: compressCanvas.width,
          height: compressCanvas.height
        })
      } catch (error) {
        reject(error)
      }
    }
  })
}

const getStyleValue = (style: string): string => style.split('-')[1]
const defaultUnitExportFn = (unit: string) => unit + 'px'
const defaultUnitImportFn = (unit: string) => unit.replace('px', '')

const ignoredNodeAttributes = ['style']
const ignoredEntityNodeAttributes = [
  'style',
  'href',
  'target',
  'alt',
  'title',
  'id',
  'controls',
  'autoplay',
  'loop',
  'poster'
]

const spreadNodeAttributes = (attributesObject) => {
  return Object.keys(attributesObject)
    .reduce((attributeString, attributeName) => {
      return `${attributeString} ${attributeName}="${attributesObject[attributeName]}"`
    }, '')
    .replace(/^\s$/, '')
}

const blocks = {
  'header-one': 'h1',
  'header-two': 'h2',
  'header-three': 'h3',
  'header-four': 'h4',
  'header-five': 'h5',
  'header-six': 'h6',
  unstyled: 'p',
  blockquote: 'blockquote'
}

const blockTypes = Object.keys(blocks)
const blockNames = blockTypes.map((key) => blocks[key])

const convertAtomicBlock = (
  block,
  contentState: ContentState,
  blockNodeAttributes
) => {
  if (!block || !block.key) {
    return <p />
  }

  const contentBlock = contentState.getBlockForKey(block.key)

  const { class: className, ...nodeAttrAsProps } = blockNodeAttributes
  nodeAttrAsProps.className = className

  if (!contentBlock) {
    return <p />
  }

  const entityKey = contentBlock.getEntityAt(0)

  if (!entityKey) {
    return <p />
  }

  const entity = contentState.getEntity(entityKey)
  const mediaType = entity.getType().toLowerCase()

  const { float, alignment } = block.data
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const { url, link, link_target, width, height, meta } = entity.getData()

  if (mediaType === 'image') {
    const imageWrapStyle: CSSProperties = {}
    let styledClassName = ''

    if (float) {
      imageWrapStyle.float = float
      styledClassName += ' kedao-float-' + float
    } else if (alignment) {
      imageWrapStyle.textAlign = alignment
      styledClassName += ' kedao-align-' + alignment
    }

    if (link) {
      return (
        <div
          className={styledClassName}
          style={imageWrapStyle}
        >
          <a
            style={{ display: 'inline-block' }}
            href={link}
            target={link_target}
          >
            <img
              {...nodeAttrAsProps}
              {...meta}
              src={url}
              width={width}
              height={height}
              style={{ width, height }}
            />
          </a>
        </div>
      )
    } else {
      return (
        <div
          className={styledClassName}
          style={imageWrapStyle}
        >
          <img
            {...nodeAttrAsProps}
            {...meta}
            src={url}
            width={width}
            height={height}
            style={{ width, height }}
          />
        </div>
      )
    }
  } else if (mediaType === 'audio') {
    return (
      <div>
        <audio controls {...nodeAttrAsProps} {...meta} src={url} />
      </div>
    )
  } else if (mediaType === 'video') {
    return (
      <div>
        <video
          controls
          {...nodeAttrAsProps}
          {...meta}
          src={url}
          width={width}
          height={height}
        />
      </div>
    )
  } else if (mediaType === 'embed') {
    return (
      <div>
        <div dangerouslySetInnerHTML={{ __html: url }} />
      </div>
    )
  } else if (mediaType === 'hr') {
    return <hr />
  } else {
    return <p />
  }
}

const entityToHTML = (options) => (entity, originalText) => {
  const { entityExportFn } = options
  const entityType = entity.type.toLowerCase()

  if (entityExportFn as boolean) {
    const customOutput = entityExportFn(entity, originalText)
    if (customOutput as boolean) {
      return customOutput
    }
  }

  if (entityType === 'link') {
    const { class: className, ...nodeAttrAsProps } =
      entity.data.nodeAttributes ?? {}
    nodeAttrAsProps.className = className
    return (
      <a
        href={entity.data.href}
        target={entity.data.target}
        {...nodeAttrAsProps}
      />
    )
  }
}

const styleToHTML = (options) => (style) => {
  const unitExportFn = options.unitExportFn ?? defaultUnitExportFn

  if (options.styleExportFn as boolean) {
    const customOutput = options.styleExportFn(style, options)
    if (customOutput as boolean) {
      return customOutput
    }
  }

  style = style.toLowerCase()

  if (style === 'strikethrough') {
    return <span style={{ textDecoration: 'line-through' }} />
  } else if (style === 'superscript') {
    return <sup />
  } else if (style === 'subscript') {
    return <sub />
  } else if (style.indexOf('color-') === 0) {
    return <span style={{ color: '#' + getStyleValue(style) }} />
  } else if (style.indexOf('bgcolor-') === 0) {
    return <span style={{ backgroundColor: '#' + getStyleValue(style) }} />
  } else if (style.indexOf('fontsize-') === 0) {
    return (
      <span
        style={{
          fontSize: unitExportFn(getStyleValue(style), 'font-size', 'html')
        }}
      />
    )
  } else if (style.indexOf('lineheight-') === 0) {
    return (
      <span
        style={{
          lineHeight: unitExportFn(getStyleValue(style), 'line-height', 'html')
        }}
      />
    )
  } else if (style.indexOf('letterspacing-') === 0) {
    return (
      <span
        style={{
          letterSpacing: unitExportFn(
            getStyleValue(style),
            'letter-spacing',
            'html'
          )
        }}
      />
    )
  } else if (style.indexOf('fontfamily-') === 0) {
    const fontFamily = options.fontFamilies.find(
      (item) => item.name.toLowerCase() === getStyleValue(style)
    )
    if (!fontFamily) return
    return <span style={{ fontFamily: fontFamily.family }} />
  }
}

const blockToHTML = (options: ConvertOptions) => (block) => {
  const { blockExportFn, contentState } = options

  if (blockExportFn) {
    const customOutput = blockExportFn(contentState, block)
    if (customOutput) {
      return customOutput
    }
  }

  let blockStyle = ''

  const blockType = block.type.toLowerCase()
  const { textAlign, textIndent, nodeAttributes = {} } = block.data
  const attributeString = spreadNodeAttributes(nodeAttributes)

  if (textAlign || textIndent) {
    blockStyle = ' style="'

    if (textAlign) {
      blockStyle += `text-align:${textAlign};`
    }

    if (textIndent && !isNaN(textIndent) && textIndent > 0) {
      blockStyle += `text-indent:${textIndent * 2}em;`
    }

    blockStyle += '"'
  }

  if (blockType === 'atomic') {
    return convertAtomicBlock(block, contentState, nodeAttributes)
  } else if (blockType === 'code-block') {
    const previousBlock = contentState.getBlockBefore(block.key)
    const nextBlock = contentState.getBlockAfter(block.key)
    const previousBlockType = previousBlock?.getType()
    const nextBlockType = nextBlock?.getType()

    let start = ''
    let end = ''

    if (previousBlockType !== 'code-block') {
      start = `<pre${attributeString}><code>`
    } else {
      start = ''
    }

    if (nextBlockType !== 'code-block') {
      end = '</code></pre>'
    } else {
      end = '<br/>'
    }

    return { start, end }
  } else if (blocks[blockType]) {
    return {
      start: `<${blocks[blockType]}${blockStyle}${attributeString}>`,
      end: `</${blocks[blockType]}>`
    }
  } else if (blockType === 'unordered-list-item') {
    return {
      start: `<li${blockStyle}${attributeString}>`,
      end: '</li>',
      nest: <ul />
    }
  } else if (blockType === 'ordered-list-item') {
    return {
      start: `<li${blockStyle}${attributeString}>`,
      end: '</li>',
      nest: <ol />
    }
  }
}

const htmlToStyle =
  (options: ConvertOptions, source) =>
    (nodeName: string, node, currentStyle) => {
      if (!node || !node.style) {
        return currentStyle
      }

      const unitImportFn = options.unitImportFn || defaultUnitImportFn
      let newStyle = currentStyle;

      [].forEach.call(node.style, (style) => {
        if (nodeName === 'span' && style === 'color') {
          const color = getHexColor(node.style.color)
          newStyle = color
            ? newStyle.add('COLOR-' + color.replace('#', '').toUpperCase())
            : newStyle
        } else if (nodeName === 'span' && style === 'background-color') {
          const color = getHexColor(node.style.backgroundColor)
          newStyle = color
            ? newStyle.add('BGCOLOR-' + color.replace('#', '').toUpperCase())
            : newStyle
        } else if (nodeName === 'span' && style === 'font-size') {
          newStyle = newStyle.add(
            'FONTSIZE-' + unitImportFn(node.style.fontSize, 'font-size', source)
          )
        } else if (
          nodeName === 'span' &&
        style === 'line-height' &&
        !isNaN(parseFloat(node.style.lineHeight))
        ) {
          newStyle = newStyle.add(
            'LINEHEIGHT-' +
            unitImportFn(node.style.lineHeight, 'line-height', source)
          )
        } else if (
          nodeName === 'span' &&
        style === 'letter-spacing' &&
        !isNaN(parseFloat(node.style.letterSpacing))
        ) {
          newStyle = newStyle.add(
            'LETTERSPACING-' +
            unitImportFn(node.style.letterSpacing, 'letter-spacing', source)
          )
        } else if (nodeName === 'span' && style === 'text-decoration') {
          if (node.style.textDecoration === 'line-through') {
            newStyle = newStyle.add('STRIKETHROUGH')
          } else if (node.style.textDecoration === 'underline') {
            newStyle = newStyle.add('UNDERLINE')
          }
        } else if (nodeName === 'span' && style === 'font-family') {
          const fontFamily = options.fontFamilies.find(
            (item) =>
              item.family.toLowerCase() === node.style.fontFamily.toLowerCase()
          )
          if (!fontFamily) return
          newStyle = newStyle.add('FONTFAMILY-' + fontFamily.name.toUpperCase())
        }
      })

      if (nodeName === 'sup') {
        newStyle = newStyle.add('SUPERSCRIPT')
      } else if (nodeName === 'sub') {
        newStyle = newStyle.add('SUBSCRIPT')
      }

      options.styleImportFn &&
      (newStyle =
        options.styleImportFn(nodeName, node, newStyle, source) || newStyle)
      return newStyle
    }

const htmlToEntity =
  (options: ConvertOptions, source) =>
    (
      nodeName: string,
      node: HTMLVideoElement & HTMLImageElement,
      createEntity
    ) => {
      if (options?.entityImportFn) {
        const customInput = options.entityImportFn(
          nodeName,
          node,
          createEntity,
          source
        )
        if (customInput) {
          return customInput
        }
      }

      nodeName = nodeName.toLowerCase()

      const { alt, title, id, controls, autoplay, loop, poster } = node
      const meta: any = {}
      const nodeAttributes = {}

      id && (meta.id = id)
      alt && (meta.alt = alt)
      title && (meta.title = title)
      controls && (meta.controls = controls)
      autoplay && (meta.autoPlay = autoplay)
      loop && (meta.loop = loop)
      poster && (meta.poster = poster)

      node.attributes &&
      Object.keys(node.attributes).forEach((key) => {
        const attr = node.attributes[key]
        !ignoredEntityNodeAttributes.includes(attr.name) &&
          (nodeAttributes[attr.name] = attr.value)
      })

      if (nodeName === 'a' && node.querySelectorAll('img').length > 0) {
        const href = node.getAttribute('href')
        const target = node.getAttribute('target')
        return createEntity('LINK', 'MUTABLE', { href, target, nodeAttributes })
      } else if (nodeName === 'audio') {
        return createEntity('AUDIO', 'IMMUTABLE', {
          url: node.getAttribute('src'),
          meta,
          nodeAttributes
        })
      } else if (nodeName === 'video') {
        return createEntity('VIDEO', 'IMMUTABLE', {
          url: node.getAttribute('src'),
          meta,
          nodeAttributes
        })
      } else if (nodeName === 'img') {
        const parentNode: any = node.parentNode
        const entityData: any = { meta }
        const { width, height } = node.style

        entityData.url = node.getAttribute('src')
        width && (entityData.width = width)
        height && (entityData.height = height)

        if (parentNode.nodeName.toLowerCase() === 'a') {
          entityData.link = parentNode.getAttribute('href')
          entityData.link_target = parentNode.getAttribute('target')
        }

        return createEntity('IMAGE', 'IMMUTABLE', entityData)
      } else if (nodeName === 'hr') {
        return createEntity('HR', 'IMMUTABLE', {})
      } else if ((node.parentNode as any)?.classList.contains('embed-wrap')) {
        const embedContent = node.innerHTML || node.outerHTML

        if (embedContent) {
          return createEntity('EMBED', 'IMMUTABLE', {
            url: embedContent
          })
        }
      }
    }

const htmlToBlock =
  (options: ConvertOptions, source) =>
    (nodeName: string, node: HTMLElement) => {
      if (options?.blockImportFn) {
        const customInput = options.blockImportFn(nodeName, node, source)
        if (customInput) {
          return customInput
        }
      }

      const nodeAttributes = {}
      const nodeStyle: any = node.style ?? {}

      node.attributes &&
      Object.keys(node.attributes).forEach((key) => {
        const attr = node.attributes[key]
        !ignoredNodeAttributes.includes(attr.name) &&
          (nodeAttributes[attr.name] = attr.value)
      })

      if (node.classList?.contains('media-wrap')) {
        return {
          type: 'atomic',
          data: {
            nodeAttributes: nodeAttributes,
            float: nodeStyle.float,
            alignment: nodeStyle.textAlign
          }
        }
      } else if (nodeName === 'img') {
        return {
          type: 'atomic',
          data: {
            nodeAttributes: nodeAttributes,
            float: nodeStyle.float,
            alignment: nodeStyle.textAlign
          }
        }
      } else if (nodeName === 'hr') {
        return {
          type: 'atomic',
          data: { nodeAttributes }
        }
      } else if (nodeName === 'pre') {
        node.innerHTML = node.innerHTML
          .replace(/<code(.*?)>/g, '')
          .replace(/<\/code>/g, '')

        return {
          type: 'code-block',
          data: { nodeAttributes }
        }
      } else if (blockNames.includes(nodeName)) {
        const blockData: any = { nodeAttributes }

        if (nodeStyle.textAlign) {
          blockData.textAlign = nodeStyle.textAlign
        }

        if (nodeStyle.textIndent) {
          blockData.textIndent = /^\d+em$/.test(nodeStyle.textIndent)
            ? Math.ceil(parseInt(nodeStyle.textIndent, 10) / 2)
            : 1
        }

        return {
          type: blockTypes[blockNames.indexOf(nodeName)],
          data: blockData
        }
      }
    }

export const getToHTMLConfig = (options: ConvertOptions) => {
  return {
    styleToHTML: styleToHTML(options),
    entityToHTML: entityToHTML(options),
    blockToHTML: blockToHTML(options)
  }
}

export const getFromHTMLConfig = (
  options: ConvertOptions,
  source = 'unknow'
) => {
  return {
    htmlToStyle: htmlToStyle(options, source),
    htmlToEntity: htmlToEntity(options, source),
    htmlToBlock: htmlToBlock(options, source)
  }
}

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

export const convertEditorStateToHTML = (editorState: EditorState, options: ConvertOptions = {}) => {
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
