import React, { useState, useEffect, useMemo } from 'react'
import './styles.scss'
import { Map } from 'immutable'
import {
  EditorState,
  SelectionState,
  ContentState,
  ContentBlock
} from 'draft-js'
import PrismDecorator from 'draft-js-prism'
import { setSelectionBlockData } from '../../utils'
import Prism from 'prismjs'

const CodeBlockWrapper = ({
  syntaxs,
  showLineNumber,
  editorState,
  editor,
  children,
  ...restProps
}) => {
  const [syntax, setSyntax] = useState(syntaxs[0].syntax)
  const [syntaxName, setSyntaxName] = useState(syntaxs[0].name)
  const offsetKey = restProps['data-offset-key']
  const blockKey = offsetKey.split('-')[0]
  const contentState = editorState.getCurrentContent()
  const codeBlockBlock = useMemo(() => {
    try {
      return contentState.getBlockForKey(blockKey)
    } catch (error) {
      return null
    }
  }, [blockKey, contentState])

  useEffect(() => {
    if (codeBlockBlock) {
      const blockData = codeBlockBlock.getData()
      const syntax = blockData.get('syntax') || syntaxs[0].syntax
      const syntaxName = syntaxs.find((item) => item.syntax === syntax).name

      if (syntaxName) {
        setSyntax(syntax)
        setSyntaxName(syntaxName)
      }
    }
  }, [codeBlockBlock])

  const setCodeBlockSyntax = (event) => {
    const syntax = event.currentTarget.dataset.syntax

    if (!syntax) {
      return
    }

    try {
      const syntaxName = syntaxs.find((item) => item.syntax === syntax).name

      if (!syntaxName) {
        return
      }

      const selectionState = SelectionState.createEmpty(blockKey)
      const newEditorState = EditorState.forceSelection(
        editorState,
        selectionState
      )
      setSyntax(syntax)
      setSyntaxName(syntaxName)

      editor.setValue(setSelectionBlockData(newEditorState, { syntax }))
    } catch (error) {
      console.warn(error)
    }
  }

  return (
    <div className="kedao-code-block-wrapper">
      <div className="kedao-code-block-header" contentEditable={false}>
        <div className="syntax-switcher">
          <span>{syntaxName}</span>
          <ul className="syntax-list">
            {syntaxs.map((item, index) => (
              <li
                key={index}
                data-syntax={item.syntax}
                onClick={setCodeBlockSyntax}
              >
                {item.name}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <pre
        className={`kedao-code-block${
          showLineNumber ? ' show-line-number' : ''
        }`}
        data-syntax={syntax}
      >
        {children}
      </pre>
    </div>
  )
}

const getCodeBlockBlock = (block: ContentBlock) => {
  if (!block || !block.getType || block.getType() !== 'code-block') {
    return null
  }

  const blockDOMNode = document.querySelector(
    `code[data-offset-key="${block.getKey()}-0-0"]`
  )

  if (!blockDOMNode) {
    return null
  }

  if (blockDOMNode.parentNode.nodeName.toLowerCase() !== 'pre') {
    return null
  }

  return (blockDOMNode.parentNode as any).dataset.syntax
}

const getCodeBlockRenderMap = (options) => (props) => {
  return Map({
    'code-block': {
      element: 'code',
      wrapper: <CodeBlockWrapper {...options} {...props} />,
      nestingEnabled: false
    }
  })
}

export default (options: any = {}) => {
  const { showLineNumber, showTools, includeEditors, excludeEditors } = options
  const syntaxs = options.syntaxs || [
    {
      name: 'JavaScript',
      syntax: 'javascript'
    },
    {
      name: 'HTML',
      syntax: 'html'
    },
    {
      name: 'CSS',
      syntax: 'css'
    }
  ]

  return [
    {
      type: 'block',
      name: 'code-block',
      includeEditors,
      excludeEditors,
      renderMap: getCodeBlockRenderMap({ syntaxs, showLineNumber, showTools }),
      importer: (nodeName: string, node) => {
        if (nodeName.toLowerCase() === 'pre') {
          try {
            const syntax = node.dataset.lang
            node.innerHTML = node.innerHTML
              .replace(/<code(.*?)>/g, '')
              .replace(/<\/code>/g, '')

            return syntax
              ? {
                  type: 'code-block',
                  data: { syntax }
                }
              : null
          } catch (error) {
            return null
          }
        }

        return null
      },
      exporter: (contentState: ContentState, block) => {
        if (block.type.toLowerCase() !== 'code-block') {
          return null
        }

        const previousBlock = contentState.getBlockBefore(block.key)
        const nextBlock = contentState.getBlockAfter(block.key)
        const previousBlockType = previousBlock?.getType()
        const nextBlockType = nextBlock?.getType()
        const syntax = block.data.syntax || syntaxs[0].syntax

        let start = ''
        let end = ''

        if (previousBlockType !== 'code-block') {
          start = `<pre data-lang="${syntax}" class="lang-${syntax}"><code class="lang-${syntax}">`
        } else {
          start = ''
        }

        if (nextBlockType !== 'code-block') {
          end = '</code></pre>'
        } else {
          end = '<br/>'
        }

        return { start, end }
      }
    },
    {
      type: 'decorator',
      includeEditors,
      excludeEditors,
      decorator: new PrismDecorator({
        prism: Prism,
        getSyntax: getCodeBlockBlock,
        defaultSyntax: syntaxs[0].syntax
      })
    }
  ]
}
