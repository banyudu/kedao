import React, { useState, useRef, useEffect } from 'react'
import { UniqueIndex } from '../utils'
import {
  MdAdd,
  MdAudiotrack,
  MdClose,
  MdCheck,
  MdCode,
  MdDescription,
  MdDone,
  MdMovie,
  MdRemove
} from 'react-icons/md'
import { defaultIconProps } from '../configs/props'
import './styles.scss'

const defaultAccepts = {
  image: 'image/png,image/jpeg,image/gif,image/webp,image/apng,image/svg',
  video: 'video/mp4',
  audio: 'audio/mp3'
}

const defaultExternals = {
  image: true,
  video: true,
  audio: true,
  embed: true
}

const FinderView = ({
  accepts = defaultAccepts,
  externals = defaultExternals,
  onChange,
  controller,
  language,
  hideProgress,
  onBeforeDeselect,
  onDeselect,
  onBeforeSelect,
  onSelect,
  onBeforeRemove,
  onRemove,
  onFileSelect,
  onCancel,
  onBeforeInsert,
  onInsert
}) => {
  const dragCounter = useRef(0)
  const initialItems = controller.getItems()

  const [draging, setDraging] = useState(false)
  // const [error, setError] = useState(false)
  const [confirmable, setConfirmable] = useState(
    initialItems.find(({ selected }) => selected)
  )
  const [external, setExternal] = useState({ url: '', type: 'IMAGE' })
  const [fileAccept, setFileAccept] = useState('')
  const [showExternalForm, setShowExternalForm] = useState(false)
  const [allowExternal, setAllowExternal] = useState(false)
  const [items, setItems] = useState(initialItems)

  const changeListenerId = useRef(
    controller.onChange((items) => {
      setItems(items)
      setConfirmable(items.find(({ selected }) => selected))
      onChange?.(items)
    })
  )

  useEffect(() => {
    const newAccepts = {
      ...defaultAccepts,
      ...accepts
    }

    const fileAccept = !newAccepts
      ? [defaultAccepts.image, defaultAccepts.video, defaultAccepts.audio].join(
          ','
        )
      : [newAccepts.image, newAccepts.video, newAccepts.audio]
          .filter((item) => item)
          .join(',')

    const external = {
      url: '',
      type: externals.image
        ? 'IMAGE'
        : externals.audio
          ? 'AUDIO'
          : externals.video
            ? 'VIDEO'
            : externals.embed
              ? 'EMBED'
              : ''
    }
    setFileAccept(fileAccept)
    setExternal(external)
    setAllowExternal(
      externals &&
        (externals.image ||
          externals.audio ||
          externals.video ||
          externals.embed)
    )
  }, [accepts, externals])

  useEffect(() => {
    return () => {
      controller.offChange(changeListenerId.current)
    }
  }, [])

  const buildItemList = () => {
    return (
      <ul className="kedao-list">
        <li className="kedao-add-item">
          <MdAdd size={50} />
          <input
            accept={fileAccept}
            onChange={reslovePickedFiles}
            multiple
            type="file"
          />
        </li>
        {items.map((item, index) => {
          let previewerComponents = null
          const progressMarker =
            item.uploading && !hideProgress
              ? (
              <div className="kedao-item-uploading">
                <div
                  className="kedao-item-uploading-bar"
                  style={{ width: item.uploadProgress / 1 + '%' }}
                ></div>
              </div>
                )
              : (
                  ''
                )

          switch (item.type) {
            case 'IMAGE':
              previewerComponents = (
                <div className="finder-image">
                  {progressMarker}
                  <img src={item.thumbnail || item.url} />
                </div>
              )
              break
            case 'VIDEO':
              previewerComponents = (
                <div className="kedao-icon kedao-video" title={item.url}>
                  {progressMarker}
                  <MdMovie {...defaultIconProps} />
                  <span>{item.name || item.url}</span>
                </div>
              )
              break
            case 'AUDIO':
              previewerComponents = (
                <div className="kedao-icon kedao-audio" title={item.url}>
                  {progressMarker}
                  <MdAudiotrack {...defaultIconProps} />
                  <span>{item.name || item.url}</span>
                </div>
              )
              break
            case 'EMBED':
              previewerComponents = (
                <div className="kedao-icon kedao-embed" title={item.url}>
                  {progressMarker}
                  <MdCode {...defaultIconProps} />
                  <span>{item.name || language.embed}</span>
                </div>
              )
              break
            default:
              previewerComponents = (
                <a
                  className="kedao-icon kedao-file"
                  title={item.url}
                  href={item.url}
                >
                  {progressMarker}
                  <MdDescription {...defaultIconProps} />
                  <span>{item.name || item.url}</span>
                </a>
              )
              break
          }

          const className = ['kedao-item']
          item.selected && className.push('active')
          item.uploading && className.push('uploading')
          item.error && className.push('error')

          return (
            <li
              key={index}
              title={item.name}
              data-id={item.id}
              className={className.join(' ')}
              onClick={toggleSelectItem}
            >
              {previewerComponents}
              {item.selected && (
                <div className="kedao-icon-selected">
                  <MdCheck size={50} color="white" />
                </div>
              )}
              <MdClose
                {...defaultIconProps}
                data-id={item.id}
                onClick={removeItem}
                className="kedao-item-remove braft-icon-close"
              />
              <span className="kedao-item-title">{item.name}</span>
            </li>
          )
        })}
      </ul>
    )
  }

  const toggleSelectItem = (event) => {
    const itemId = event.currentTarget.dataset.id
    const item = controller.getMediaItem(itemId)

    if (!item) {
      return
    }

    if (item.selected) {
      if (
        !onBeforeDeselect ||
        onBeforeDeselect([item], controller.getItems()) !== false
      ) {
        controller.deselectMediaItem(itemId)
        onDeselect?.([item], controller.getItems())
      }
    } else {
      if (
        !onBeforeSelect ||
        onBeforeSelect([item], controller.getItems()) !== false
      ) {
        controller.selectMediaItem(itemId)
        onSelect?.([item], controller.getItems())
      }
    }
  }

  const removeItem = (event) => {
    const itemId = event.currentTarget.dataset.id
    const item = controller.getMediaItem(itemId)

    if (!item) {
      return
    }

    if (
      !onBeforeRemove ||
      onBeforeRemove([item], controller.getItems()) !== false
    ) {
      controller.removeMediaItem(itemId)
      onRemove?.([item], controller.getItems())
    }

    event.stopPropagation()
  }

  const selectAllItems = () => {
    const allItems = controller.getItems()

    if (!onBeforeSelect || onBeforeSelect(allItems, allItems) !== false) {
      controller.selectAllItems()
      onSelect?.(allItems, allItems)
    }
  }

  const deselectAllItems = () => {
    const allItems = controller.getItems()

    if (!onBeforeDeselect || onBeforeDeselect(allItems, allItems) !== false) {
      controller.deselectAllItems()
      onDeselect?.(allItems, allItems)
    }
  }

  const removeSelectedItems = () => {
    const selectedItems = controller.getSelectedItems()

    if (
      !onBeforeRemove ||
      onBeforeRemove(selectedItems, controller.getItems()) !== false
    ) {
      controller.removeSelectedItems()
      onRemove?.(selectedItems, controller.getItems())
    }
  }

  const handleDragLeave = (event) => {
    event.preventDefault()
    dragCounter.current = dragCounter.current - 1
    dragCounter.current === 0 && setDraging(false)
  }

  const handleDragDrop = (event) => {
    event.preventDefault()
    dragCounter.current = 0
    setDraging(false)
    reslovePickedFiles(event)
  }

  const handleDragEnter = (event) => {
    event.preventDefault()
    dragCounter.current = dragCounter.current + 1
    setDraging(true)
  }

  const reslovePickedFiles = (event) => {
    event.persist()

    let { files } = event.type === 'drop' ? event.dataTransfer : event.target

    if (onFileSelect) {
      const result = onFileSelect(files)
      if (result === false) {
        return
      } else if (result instanceof FileList || result instanceof Array) {
        files = result
      }
    }

    const newAccepts = {
      ...defaultAccepts,
      ...accepts
    }

    controller.resolveFiles(
      {
        files: files,
        onItemReady: ({ id }) => controller.selectMediaItem(id),
        onAllReady: () => {
          event.target.value = null
        }
      },
      0,
      newAccepts
    )
  }

  const inputExternal = (event) => {
    setExternal((external) => ({
      ...external,
      url: event.target.value
    }))
  }

  const switchExternalType = (event) => {
    setExternal((external) => ({
      ...external,
      type: event.target.dataset.type
    }))
  }

  const confirmAddExternal = (event) => {
    if (
      event.target.nodeName.toLowerCase() === 'button' ||
      event.keyCode === 13
    ) {
      let { url, type } = external
      const urlArr = url.split('|')
      const name = urlArr.length > 1 ? urlArr[0] : language.unnamedItem
      url = urlArr.length > 1 ? urlArr[1] : urlArr[0]
      const thumbnail = type === 'IMAGE' ? url : null

      controller.addItems([
        {
          thumbnail,
          url,
          name,
          type,
          id: new Date().getTime() + '_' + UniqueIndex(),
          uploading: false,
          uploadProgress: 1,
          selected: true
        }
      ])

      setShowExternalForm(false)
      setExternal({ url: '', type: 'IMAGE' })
    }
  }

  const toggleExternalForm = () => {
    setShowExternalForm((v) => !v)
  }

  const cancelInsert = () => {
    onCancel?.()
  }

  const confirmInsert = () => {
    const selectedItems = controller.getSelectedItems()

    if (onBeforeInsert) {
      const filteredItems = onBeforeInsert(selectedItems)

      if (filteredItems && filteredItems instanceof Array) {
        controller.deselectAllItems()
        onInsert?.(filteredItems)
      } else if (filteredItems !== false) {
        controller.deselectAllItems()
        onInsert?.(selectedItems)
      }
    } else {
      controller.deselectAllItems()
      onInsert?.(selectedItems)
    }
  }

  return (
    <div className="kedao-finder">
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDragDrop}
        className="kedao-uploader"
      >
        <div
          className={
            'kedao-drag-uploader ' +
            (draging || !items.length ? 'active ' : ' ') +
            (draging ? 'draging' : '')
          }
        >
          <span className="kedao-drag-tip">
            <input
              accept={fileAccept}
              onChange={reslovePickedFiles}
              multiple
              type="file"
            />
            {draging ? language.dropTip : language.dragTip}
          </span>
        </div>
        {items.length
          ? (
          <div className="kedao-list-wrap">
            <div className="kedao-list-tools">
              <span onClick={selectAllItems} className="kedao-select-all">
                <MdDone {...defaultIconProps} />
                {language.selectAll}
              </span>
              <span
                onClick={deselectAllItems}
                className="kedao-deselect-all"
                {...{ disabled: !confirmable }}
              >
                <MdClose {...defaultIconProps} />
                {language.deselect}
              </span>
              <span
                onClick={removeSelectedItems}
                className="kedao-remove-selected"
                {...{ disabled: !confirmable }}
              >
                <MdRemove {...defaultIconProps} />
                {language.removeSelected}
              </span>
            </div>
            {buildItemList()}
          </div>
            )
          : null}
        {showExternalForm && allowExternal
          ? (
          <div className="kedao-add-external">
            <div className="kedao-external-form">
              <div className="kedao-external-input">
                <div>
                  <input
                    onKeyDown={confirmAddExternal}
                    value={external.url}
                    onChange={inputExternal}
                    placeholder={language.externalInputPlaceHolder}
                  />
                </div>
                <button
                  type="button"
                  onClick={confirmAddExternal}
                  disabled={!external.url.trim().length}
                >
                  {language.confirm}
                </button>
              </div>
              <div
                data-type={external.type}
                className="kedao-switch-external-type"
              >
                {externals.image
                  ? (
                  <button
                    type="button"
                    onClick={switchExternalType}
                    data-type="IMAGE"
                  >
                    {language.image}
                  </button>
                    )
                  : null}
                {externals.audio
                  ? (
                  <button
                    type="button"
                    onClick={switchExternalType}
                    data-type="AUDIO"
                  >
                    {language.audio}
                  </button>
                    )
                  : null}
                {externals.video
                  ? (
                  <button
                    type="button"
                    onClick={switchExternalType}
                    data-type="VIDEO"
                  >
                    {language.video}
                  </button>
                    )
                  : null}
                {externals.embed
                  ? (
                  <button
                    type="button"
                    onClick={switchExternalType}
                    data-type="EMBED"
                  >
                    {language.embed}
                  </button>
                    )
                  : null}
              </div>
              <span className="kedao-external-tip">
                {language.externalInputTip}
              </span>
            </div>
          </div>
            )
          : null}
      </div>
      <footer className="kedao-manager-footer">
        <div className="pull-left">
          {allowExternal
            ? (
            <span
              onClick={toggleExternalForm}
              className="kedao-toggle-external-form"
            >
              {showExternalForm
                ? (
                <span className="kedao-bottom-text">
                  <MdAdd {...defaultIconProps} />
                  {language.addLocalFile}
                </span>
                  )
                : (
                <span className="kedao-bottom-text">
                  <MdAdd {...defaultIconProps} /> {language.addExternalSource}
                </span>
                  )}
            </span>
              )
            : null}
        </div>
        <div className="pull-right">
          <button
            onClick={confirmInsert}
            className="button button-insert"
            disabled={!confirmable}
          >
            {language.insert}
          </button>
          <button onClick={cancelInsert} className="button button-cancel">
            {language.cancel}
          </button>
        </div>
      </footer>
    </div>
  )
}

export default FinderView
