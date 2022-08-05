import { classNameParser } from '../../utils/style'
import styles from './style.module.scss'
const cls = classNameParser(styles)

export default (customBlockStyleFn) => (block) => {
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
