import {
  Modifier,
  EditorState,
  RawDraftContentState,
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
import { ConvertOptions, Position } from '../types'

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

export const removeBlock = (
  editorState: EditorState,
  block: ContentBlock,
  lastSelection = null
) => {
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

export const updateEachCharacterOfSelection = (
  editorState: EditorState,
  callback: Function
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
  color
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
  text,
  inlineStyle?,
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
  source
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
  data
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

const _namedColors = {
  aliceblue: '#f0f8ff',
  antiquewhite: '#faebd7',
  aqua: '#00ffff',
  aquamarine: '#7fffd4',
  azure: '#f0ffff',
  beige: '#f5f5dc',
  bisque: '#ffe4c4',
  black: '#000000',
  blanchedalmond: '#ffebcd',
  blue: '#0000ff',
  blueviolet: '#8a2be2',
  brown: '#a52a2a',
  burlywood: '#deb887',
  cadetblue: '#5f9ea0',
  chartreuse: '#7fff00',
  chocolate: '#d2691e',
  coral: '#ff7f50',
  cornflowerblue: '#6495ed',
  cornsilk: '#fff8dc',
  crimson: '#dc143c',
  cyan: '#00ffff',
  darkblue: '#00008b',
  darkcyan: '#008b8b',
  darkgoldenrod: '#b8860b',
  darkgray: '#a9a9a9',
  darkgreen: '#006400',
  darkkhaki: '#bdb76b',
  darkmagenta: '#8b008b',
  darkolivegreen: '#556b2f',
  darkorange: '#ff8c00',
  darkorchid: '#9932cc',
  darkred: '#8b0000',
  darksalmon: '#e9967a',
  darkseagreen: '#8fbc8f',
  darkslateblue: '#483d8b',
  darkslategray: '#2f4f4f',
  darkturquoise: '#00ced1',
  darkviolet: '#9400d3',
  deeppink: '#ff1493',
  deepskyblue: '#00bfff',
  dimgray: '#696969',
  dodgerblue: '#1e90ff',
  firebrick: '#b22222',
  floralwhite: '#fffaf0',
  forestgreen: '#228b22',
  fuchsia: '#ff00ff',
  gainsboro: '#dcdcdc',
  ghostwhite: '#f8f8ff',
  gold: '#ffd700',
  goldenrod: '#daa520',
  gray: '#808080',
  green: '#008000',
  greenyellow: '#adff2f',
  honeydew: '#f0fff0',
  hotpink: '#ff69b4',
  'indianred ': '#cd5c5c',
  indigo: '#4b0082',
  ivory: '#fffff0',
  khaki: '#f0e68c',
  lavender: '#e6e6fa',
  lavenderblush: '#fff0f5',
  lawngreen: '#7cfc00',
  lemonchiffon: '#fffacd',
  lightblue: '#add8e6',
  lightcoral: '#f08080',
  lightcyan: '#e0ffff',
  lightgoldenrodyellow: '#fafad2',
  lightgrey: '#d3d3d3',
  lightgreen: '#90ee90',
  lightpink: '#ffb6c1',
  lightsalmon: '#ffa07a',
  lightseagreen: '#20b2aa',
  lightskyblue: '#87cefa',
  lightslategray: '#778899',
  lightsteelblue: '#b0c4de',
  lightyellow: '#ffffe0',
  lime: '#00ff00',
  limegreen: '#32cd32',
  linen: '#faf0e6',
  magenta: '#ff00ff',
  maroon: '#800000',
  mediumaquamarine: '#66cdaa',
  mediumblue: '#0000cd',
  mediumorchid: '#ba55d3',
  mediumpurple: '#9370d8',
  mediumseagreen: '#3cb371',
  mediumslateblue: '#7b68ee',
  mediumspringgreen: '#00fa9a',
  mediumturquoise: '#48d1cc',
  mediumvioletred: '#c71585',
  midnightblue: '#191970',
  mintcream: '#f5fffa',
  mistyrose: '#ffe4e1',
  moccasin: '#ffe4b5',
  navajowhite: '#ffdead',
  navy: '#000080',
  oldlace: '#fdf5e6',
  olive: '#808000',
  olivedrab: '#6b8e23',
  orange: '#ffa500',
  orangered: '#ff4500',
  orchid: '#da70d6',
  palegoldenrod: '#eee8aa',
  palegreen: '#98fb98',
  paleturquoise: '#afeeee',
  palevioletred: '#d87093',
  papayawhip: '#ffefd5',
  peachpuff: '#ffdab9',
  peru: '#cd853f',
  pink: '#ffc0cb',
  plum: '#dda0dd',
  powderblue: '#b0e0e6',
  purple: '#800080',
  rebeccapurple: '#663399',
  red: '#ff0000',
  rosybrown: '#bc8f8f',
  royalblue: '#4169e1',
  saddlebrown: '#8b4513',
  salmon: '#fa8072',
  sandybrown: '#f4a460',
  seagreen: '#2e8b57',
  seashell: '#fff5ee',
  sienna: '#a0522d',
  silver: '#c0c0c0',
  skyblue: '#87ceeb',
  slateblue: '#6a5acd',
  slategray: '#708090',
  snow: '#fffafa',
  springgreen: '#00ff7f',
  steelblue: '#4682b4',
  tan: '#d2b48c',
  teal: '#008080',
  thistle: '#d8bfd8',
  tomato: '#ff6347',
  turquoise: '#40e0d0',
  violet: '#ee82ee',
  wheat: '#f5deb3',
  white: '#ffffff',
  whitesmoke: '#f5f5f5',
  yellow: '#ffff00',
  yellowgreen: '#9acd32'
}

const _getHexColor = (color) => {
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

export const namedColors = _namedColors
export const getHexColor = _getHexColor

export const detectColorsFromHTMLString = (html) => {
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
