import './style.scss'

export default (customBlockStyleFn) => (block) => {
  const blockAlignment = block.getData() && block.getData().get('textAlign')
  const blockIndent = block.getData() && block.getData().get('textIndent')
  const blockFloat = block.getData() && block.getData().get('float')

  const className = [
    blockAlignment && `kedao-alignment-${blockAlignment}`,
    blockIndent && `kedao-text-indent-${blockIndent}`,
    blockFloat && `kedao-float-${blockFloat}`,
    customBlockStyleFn?.(block)
  ].filter(Boolean).join(' ')

  return className
}
