/* eslint-disable react/display-name */
import React, { CSSProperties } from 'react'
import { ContentState } from 'draft-js'
import { ConvertOptions } from '../types'
import './style.scss'
import { namedColors } from '../constants'

/**
 * @deprecated import namedColors from constants instead
 */
export { namedColors }

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

export const defaultFontFamilies = [
  {
    name: 'Araial',
    family: 'Arial, Helvetica, sans-serif'
  },
  {
    name: 'Georgia',
    family: 'Georgia, serif'
  },
  {
    name: 'Impact',
    family: 'Impact, serif'
  },
  {
    name: 'Monospace',
    family: '"Courier New", Courier, monospace'
  },
  {
    name: 'Tahoma',
    family: "tahoma, arial, 'Hiragino Sans GB', 宋体, sans-serif"
  }
]

export const getHexColor = (color: string): string | null => {
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

export const blocks = {
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
      styledClassName += ' float-' + float
    } else if (alignment) {
      imageWrapStyle.textAlign = alignment
      styledClassName += ' align-' + alignment
    }

    if (link) {
      return (
        <div
          className={'media-wrap image-wrap' + styledClassName}
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
          className={'media-wrap image-wrap' + styledClassName}
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
      <div className="media-wrap audio-wrap">
        <audio controls {...nodeAttrAsProps} {...meta} src={url} />
      </div>
    )
  } else if (mediaType === 'video') {
    return (
      <div className="media-wrap video-wrap">
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
      <div className="media-wrap embed-wrap">
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
