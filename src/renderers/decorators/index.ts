import { CharacterMetadata, CompositeDecorator, ContentBlock, ContentState } from 'draft-js'
import CombineDecorators from 'draft-js-multidecorators'
import Immutable from 'immutable'
import Link from './Link'

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

export default () => {
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
