import {
  Modifier,
  EditorState,
  SelectionState,
  RichUtils,
  CharacterMetadata,
  AtomicBlockUtils,
  convertFromRaw,
  ContentBlock
} from 'draft-js'
import { setBlockData, getSelectionEntity } from 'draftjs-utils'
import { convertHTMLToRaw } from '../convert'
import Immutable from 'immutable'
import { ConvertOptions } from '../types'

const strictBlockTypes = ['atomic']

export const registerStrictBlockType = (blockType: string) => {
  !strictBlockTypes.includes(blockType) && strictBlockTypes.push(blockType)
}

export const selectionContainsBlockType = (editorState: EditorState, blockType: string) => {
  return getSelectedBlocks(editorState).find(
    (block) => block.getType() === blockType
  )
}

export const selectionContainsStrictBlock = (editorState: EditorState) => {
  return getSelectedBlocks(editorState).find(
    (block) => ~strictBlockTypes.indexOf(block.getType())
  )
}

export const selectBlock = (editorState: EditorState, block) => {
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

export const selectNextBlock = (editorState: EditorState, block) => {
  const nextBlock = editorState
    .getCurrentContent()
    .getBlockAfter(block.getKey())
  return nextBlock ? selectBlock(editorState, nextBlock) : editorState
}

export const removeBlock = (editorState: EditorState, block: ContentBlock, lastSelection = null) => {
  let nextContentState
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

export const updateEachCharacterOfSelection = (editorState: EditorState, callback) => {
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
    let nextCharactersList = null

    if (blockKey === startKey && blockKey === endKey) {
      nextCharactersList = charactersList.map((character, index) => {
        if (index >= startOffset && index < endOffset) {
          return callback(character)
        }
        return character
      })
    } else if (blockKey === startKey) {
      nextCharactersList = charactersList.map((character, index) => {
        if (index >= startOffset) {
          return callback(character)
        }
        return character
      })
    } else if (blockKey === endKey) {
      nextCharactersList = charactersList.map((character, index) => {
        if (index < endOffset) {
          return callback(character)
        }
        return character
      })
    } else {
      nextCharactersList = charactersList.map((character) => {
        return callback(character)
      })
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
      selectedBlocks.push(nextBlock)
      blockKey = nextBlock.getKey()
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

export const getSelectionBlockData = (editorState: EditorState, name?: string): any => {
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

export const toggleSelectionBlockType = (editorState: EditorState, blockType: string) => {
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

export const getSelectionEntityData = (editorState: EditorState, type) => {
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

export const toggleSelectionLink = (editorState: EditorState, href, target?) => {
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

export const selectionHasInlineStyle = (editorState: EditorState, style) => {
  return getSelectionInlineStyle(editorState).has(style.toUpperCase())
}

export const toggleSelectionInlineStyle = (
  editorState: EditorState,
  style: string,
  prefix = ''
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

export const toggleSelectionAlignment = (editorState: EditorState, alignment) => {
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

export const increaseSelectionIndent = (editorState: EditorState, maxIndent = 6) => {
  const currentIndent: number =
    getSelectionBlockData(editorState, 'textIndent') || 0
  return toggleSelectionIndent(editorState, currentIndent + 1, maxIndent)
}

export const decreaseSelectionIndent = (editorState: EditorState, maxIndent?) => {
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

export const toggleSelectionBackgroundColor = (editorState: EditorState, color) => {
  return toggleSelectionInlineStyle(
    editorState,
    color.replace('#', ''),
    'BGCOLOR-'
  )
}

export const toggleSelectionFontSize = (editorState: EditorState, fontSize) => {
  return toggleSelectionInlineStyle(editorState, fontSize, 'FONTSIZE-')
}

export const toggleSelectionLineHeight = (editorState: EditorState, lineHeight) => {
  return toggleSelectionInlineStyle(editorState, lineHeight, 'LINEHEIGHT-')
}

export const toggleSelectionFontFamily = (editorState: EditorState, fontFamily) => {
  return toggleSelectionInlineStyle(editorState, fontFamily, 'FONTFAMILY-')
}

export const toggleSelectionLetterSpacing = (editorState: EditorState, letterSpacing) => {
  return toggleSelectionInlineStyle(
    editorState,
    letterSpacing,
    'LETTERSPACING-'
  )
}

export const insertText = (editorState: EditorState, text, inlineStyle?, entity?) => {
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

export const insertHTML = (editorState: EditorState, options: ConvertOptions, htmlString: string, source) => {
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
  type,
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

export const insertMedias = (editorState: EditorState, medias = []): EditorState => {
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

export const setMediaData = (editorState: EditorState, entityKey, data): EditorState => {
  return EditorState.push(
    editorState,
    editorState.getCurrentContent().mergeEntityData(entityKey, data),
    'change-block-data'
  )
}

export const removeMedia = (editorState: EditorState, mediaBlock) => {
  return removeBlock(editorState, mediaBlock)
}

export const setMediaPosition = (editorState: EditorState, mediaBlock, position) => {
  const newPosition: Record<string, any> = {}
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

export const handleKeyCommand = (editorState: EditorState, command) => {
  return RichUtils.handleKeyCommand(editorState, command)
}

export const undo = (editorState: EditorState) => {
  return EditorState.undo(editorState)
}

export const redo = (editorState: EditorState) => {
  return EditorState.redo(editorState)
}
