import { KeyboardEvent } from 'react'
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
  KeyBindingUtil
} from 'draft-js'
import { convertHTMLToRaw } from '../convert'
import Immutable from 'immutable'
import { ConvertOptions, Position } from '../types'
import { namedColors } from '../constants'

/**
 * @deprecated import namedColors from constants instead
 */
export { namedColors }

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
  blockMap = blockMap.merge(blocks)
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
