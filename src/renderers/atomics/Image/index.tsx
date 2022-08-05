import React, { FC, useState, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { setMediaData, setMediaPosition, removeBlock } from '../../../utils'
import { imageControlItems } from '../../../configs/controls'
import Switch from '../../../components/Switch'
import './style.scss'
import {
  CallbackEditor,
  CommonPickerProps,
  ImageControlItem
} from '../../../types'
import { ContentBlock } from 'draft-js'
import MeidaToolbar from '../../../components/MediaToolbar'

interface ImageProps extends CommonPickerProps {
  editor: CallbackEditor
  imageEqualRatio: boolean
  entityKey: string
  containerNode: HTMLElement
  block: ContentBlock
  mediaData: any
  imageResizable: boolean
  imageControls: ImageControlItem[]
}

const Image: FC<ImageProps> = ({
  imageEqualRatio,
  editor,
  getContainerNode,
  containerNode,
  block,
  hooks,
  entityKey,
  mediaData,
  language,
  imageControls,
  imageResizable
}) => {
  const [toolbarVisible, setToolbarVisible] = useState(false)
  const [toolbarOffset, setToolbarOffset] = useState(0)
  const [linkEditorVisible, setLinkEditorVisible] = useState(false)
  const [sizeEditorVisible, setSizeEditorVisible] = useState(false)
  const [tempLink, setTempLink] = useState(null)
  const [tempWidth, setTempWidth] = useState(0)
  const [tempHeight, setTempHeight] = useState(0)

  const imageElement = useRef<HTMLImageElement>(null)
  const toolbarElement = useRef<HTMLDivElement>(null)
  const initialLeft = useRef(0)
  const initialTop = useRef(0)
  const initialWidth = useRef(0)
  const initialHeight = useRef(0)
  const reSizeType = useRef(undefined)
  const zoom = useRef(undefined)

  const changeSize = (e) => {
    const type = reSizeType.current
    if (!initialLeft.current) {
      initialLeft.current = e.screenX
      initialTop.current = e.screenY
    }
    if (type === 'rightbottom') {
      initialHeight.current += e.screenY - initialTop.current
      initialWidth.current += e.screenX - initialLeft.current
    }
    if (type === 'leftbottom') {
      initialHeight.current += e.screenY - initialTop.current
      initialWidth.current += -e.screenX + initialLeft.current
    }

    initialLeft.current = e.screenX
    initialTop.current = e.screenY
  }

  const moveImage = (e) => {
    changeSize(e)
    setTempWidth(Math.abs(initialWidth.current))
    setTempHeight(Math.abs(initialHeight.current))
  }

  const upImage = () => {
    if (imageEqualRatio) {
      confirmImageSizeEqualRatio()
    } else {
      confirmImageSize()
    }
    document.removeEventListener('mousemove', moveImage)
    document.removeEventListener('mouseup', upImage)
  }

  const repareChangeSize = (type: string) => (e) => {
    reSizeType.current = type
    const imageRect = imageElement.current?.getBoundingClientRect()
    initialTop.current = 0
    initialLeft.current = 0
    initialWidth.current = imageRect.width
    initialHeight.current = imageRect.height
    zoom.current = imageRect.width / imageRect.height
    e.preventDefault()
    document.addEventListener('mousemove', moveImage)
    document.addEventListener('mouseup', upImage)
  }

  const lockEditor = () => {
    editor.lockOrUnlockEditor(true)
  }

  const unlockEditor = () => {
    editor.lockOrUnlockEditor(false)
  }

  const calcToolbarOffset = () => {
    const container = getContainerNode ? getContainerNode() : containerNode
    const viewRect = container
      ?.querySelector('.kedao-content')
      ?.getBoundingClientRect()
    const toolbarRect = toolbarElement.current?.getBoundingClientRect()
    const imageRect = imageElement.current?.getBoundingClientRect()
    if (!container || !viewRect || !toolbarRect || !imageRect) {
      return 0
    }

    const right =
      viewRect.right -
      (imageRect.right - imageRect.width / 2 + toolbarRect.width / 2)
    const left =
      imageRect.left +
      imageRect.width / 2 -
      toolbarRect.width / 2 -
      viewRect.left

    if (right < 10) {
      return right - 10
    } else if (left < 10) {
      return left * -1 + 10
    } else {
      return 0
    }
  }

  const handleDragStart = () => {
    if (editor.editorProps.readOnly || editor.editorProps.disabled) {
      return false
    }

    (window as any).__KEDAO_DRAGING__IMAGE__ = {
      block: block,
      mediaData: {
        type: 'IMAGE',
        ...mediaData
      }
    }

    setToolbarVisible(false)
    unlockEditor()

    return true
  }

  const handleDragEnd = () => {
    (window as any).__KEDAO_DRAGING__IMAGE__ = null
    return false
  }

  const executeCommand = (command: string | Function) => {
    const allCommands = {
      setImageFloat,
      setImageAlignment,
      toggleSizeEditor,
      toggleLinkEditor,
      removeImage
    }
    if (typeof command === 'string') {
      const [method, param] = command.split('|')
      allCommands[method]?.(param)
    } else if (typeof command === 'function') {
      command(block, mediaData, editor.getValue())
    }
  }

  const removeImage = () => {
    editor.setValue(removeBlock(editor.getValue(), block))
    unlockEditor()
  }

  const toggleLinkEditor = () => {
    setLinkEditorVisible((v) => !v)
    setSizeEditorVisible(false)
  }

  const toggleSizeEditor = () => {
    setLinkEditorVisible(false)
    setSizeEditorVisible((v) => !v)
  }

  const handleLinkInputKeyDown = (e) => {
    if (e.keyCode === 13) {
      confirmImageLink()
    }
  }

  const setImageLink = (e) => {
    setTempLink(e.currentTarget.value)
  }

  const setImageLinkTarget = (linkTarget) => {
    let newLinkTarget
    const hookReturns = hooks('set-image-link-target', linkTarget)(linkTarget)

    if (hookReturns === false) {
      return false
    }

    if (typeof hookReturns === 'string') {
      newLinkTarget = hookReturns
    }

    newLinkTarget = newLinkTarget === '_blank' ? '' : '_blank'
    editor.setValue(
      setMediaData(editor.getValue(), entityKey, { newLinkTarget })
    )
    window.setImmediate(editor.forceRender)
    return true
  }

  const confirmImageLink = () => {
    let link: string | null = tempLink
    const hookReturns = hooks('set-image-link', link)(link)

    if (hookReturns === false) {
      return false
    }

    if (typeof hookReturns === 'string') {
      link = hookReturns
    }

    if (link !== null) {
      editor.setValue(setMediaData(editor.getValue(), entityKey, { link }))
      window.setImmediate(editor.forceRender)
    }
    return true
  }

  const handleSizeInputKeyDown = (e) => {
    if (e.keyCode === 13) {
      confirmImageSize()
    }
  }

  const setImageWidth = ({ currentTarget }) => {
    let { value } = currentTarget

    if (value && !isNaN(value)) {
      value += 'px'
    }

    setTempWidth(value)
  }

  const setImageHeight = ({ currentTarget }) => {
    let { value } = currentTarget

    if (value && !isNaN(value)) {
      value += 'px'
    }

    setTempHeight(value)
  }

  const confirmImageSize = () => {
    const width = tempWidth
    const height = tempHeight
    let newImageSize: any = {}

    if (width !== null) {
      newImageSize.width = width
    }
    if (height !== null) {
      newImageSize.height = height
    }

    const hookReturns = hooks('set-image-size', newImageSize)(newImageSize)

    if (hookReturns === false) {
      return false
    }

    if (hookReturns && (hookReturns.width || hookReturns.height)) {
      newImageSize = hookReturns
    }

    editor.setValue(setMediaData(editor.getValue(), entityKey, newImageSize))
    window.setImmediate(editor.forceRender)
    return true
  }

  const confirmImageSizeEqualRatio = () => {
    const width = tempWidth
    const height = tempHeight
    let equalWidth
    let equalHeight
    let newImageSize: any = {}
    // 宽度过大 图片等比缩放
    if (width / height > zoom.current) {
      equalWidth = Math.floor(height * zoom.current)
      setTempWidth(equalWidth)
      equalHeight = height
    } else if (width / height < zoom.current) {
      equalHeight = Math.floor(width / zoom.current)
      setTempHeight(equalHeight)
      equalWidth = width
    }
    if (equalWidth !== null) {
      newImageSize.width = equalWidth
    }
    if (equalHeight !== null) {
      newImageSize.height = equalHeight
    }

    const hookReturns = hooks('set-image-size', newImageSize)(newImageSize)

    if (hookReturns === false) {
      return false
    }

    if (hookReturns && (hookReturns.width || hookReturns.height)) {
      newImageSize = hookReturns
    }

    editor.setValue(setMediaData(editor.getValue(), entityKey, newImageSize))
    window.setImmediate(editor.forceRender)
    return true
  }

  const setImageFloat = (float) => {
    let newFloat = float
    const hookReturns = hooks('set-image-float', newFloat)(newFloat)

    if (hookReturns === false) {
      return false
    }

    if (typeof hookReturns === 'string') {
      newFloat = hookReturns
    }

    editor.setValue(
      setMediaPosition(editor.getValue(), block, {
        float: newFloat
      })
    )
    unlockEditor()
    return true
  }

  const setImageAlignment = (alignment) => {
    let newAlignment = alignment
    const hookReturns = hooks(
      'set-image-alignment',
      newAlignment
    )(newAlignment)

    if (hookReturns === false) {
      return false
    }

    if (typeof hookReturns === 'string') {
      newAlignment = hookReturns
    }

    editor.setValue(
      setMediaPosition(editor.getValue(), block, {
        alignment: newAlignment
      })
    )
    unlockEditor()
    return true
  }

  const showToolbar = (event) => {
    if (editor.editorProps.readOnly || editor.editorProps.disabled) {
      return false
    }

    event.preventDefault()

    if (!toolbarVisible) {
      setToolbarVisible(true)
      lockEditor()
      setToolbarOffset(calcToolbarOffset())
    }
    return true
  }

  const hideToolbar = (event) => {
    event.preventDefault()

    setToolbarVisible(false)
    unlockEditor()
  }

  const blockData = block.getData()

  const float = blockData.get('float')
  let alignment = blockData.get('alignment')
  const { url, link, linkTarget, width, height, meta } = mediaData
  const imageStyles: any = {}
  let clearFix = false

  if (float) {
    alignment = null
  } else if (alignment === 'left') {
    imageStyles.float = 'left'
    clearFix = true
  } else if (alignment === 'right') {
    imageStyles.float = 'right'
    clearFix = true
  } else if (alignment === 'center') {
    imageStyles.textAlign = 'center'
  } else {
    imageStyles.float = 'left'
    clearFix = true
  }

  const renderedControlItems = imageControls.map((item) => {
    if (typeof item === 'string') {
      if (imageControlItems[item]) {
        return (
          <a
            className={item === 'link' && link ? 'active' : ''}
            role="presentation"
            key={uuidv4()}
            onClick={() => executeCommand(imageControlItems[item].command)}
          >
            {imageControlItems[item].text}
          </a>
        )
      }
    } else if (item && (item.render || item.text)) {
      return item.render
        ? (
            item.render(mediaData, block)
          )
        : (
        <a
          key={uuidv4()}
          role="presentation"
          onClick={() => item.onClick && executeCommand(item.onClick)}
        >
          {item.text}
        </a>
          )
    }
    return null
  })

  return (
    <div className="kedao-media">
      <div
        style={imageStyles}
        draggable
        onMouseEnter={showToolbar}
        onMouseMove={showToolbar}
        onMouseLeave={hideToolbar}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        className="kedao-image"
      >
        {toolbarVisible
          ? (
          <MeidaToolbar
            style={{ marginLeft: toolbarOffset }}
            ref={toolbarElement}
            data-float={float}
            data-align={alignment}
            className="image-toolbar"
          >
            {linkEditorVisible
              ? (
              <div className="kedao-image-link-editor">
                <div className="editor-input-group">
                  <input
                    type="text"
                    placeholder={language.linkEditor.inputWithEnterPlaceHolder}
                    onKeyDown={handleLinkInputKeyDown}
                    onChange={setImageLink}
                    defaultValue={link}
                  />
                  <button type="button" onClick={confirmImageLink}>
                    {language.base.confirm}
                  </button>
                </div>
                <div className="switch-group">
                  <Switch
                    active={linkTarget === '_blank'}
                    onClick={() => setImageLinkTarget(linkTarget)}
                  />
                  <label>{language.linkEditor.openInNewWindow}</label>
                </div>
              </div>
                )
              : null}
            {sizeEditorVisible
              ? (
              <div className="kedao-image-size-editor">
                <div className="editor-input-group">
                  <input
                    type="text"
                    placeholder={language.base.width}
                    onKeyDown={handleSizeInputKeyDown}
                    onChange={setImageWidth}
                    defaultValue={width}
                  />
                  <input
                    type="text"
                    placeholder={language.base.height}
                    onKeyDown={handleSizeInputKeyDown}
                    onChange={setImageHeight}
                    defaultValue={height}
                  />
                  <button type="button" onClick={confirmImageSize}>
                    {language.base.confirm}
                  </button>
                </div>
              </div>
                )
              : null}
            {renderedControlItems}
            <i
              style={{ marginLeft: toolbarOffset * -1 }}
              className="image-toolbar-arrow"
            />
          </MeidaToolbar>
            )
          : null}
        <div
          style={{
            position: 'relative',
            width: `${width}px`,
            height: `${height}px`,
            display: 'inline-block'
          }}
        >
          <img
            ref={imageElement}
            src={url}
            alt="Alt"
            width={width}
            height={height}
            {...meta}
          />
          {toolbarVisible && imageResizable
            ? (
            <div
              role="presentation"
              className="kedao-csize-icon right-bottom"
              onMouseDown={repareChangeSize('rightbottom')}
            />
              )
            : null}
          {toolbarVisible && imageResizable
            ? (
            <div
              role="presentation"
              className="kedao-csize-icon left-bottom"
              onMouseDown={repareChangeSize('leftbottom')}
            />
              )
            : null}
          <div
            className={`kedao-pre-csize ${reSizeType.current}`}
            style={{ width: `${tempWidth}px`, height: `${tempHeight}px` }}
          />
        </div>
      </div>
      {clearFix && (
        <div
          className="clearfix"
          style={{ clear: 'both', height: 0, lineHeight: 0, float: 'none' }}
        />
      )}
    </div>
  )
}

export default Image
