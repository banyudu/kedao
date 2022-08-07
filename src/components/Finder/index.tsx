import React, { forwardRef, useEffect, useState, useRef, useImperativeHandle, useMemo } from 'react'
import { UniqueIndex, compressImage } from '../../utils'
import { classNameParser } from '../../utils/style'
import styles from './styles.module.scss'
import Icon from '../Icon'
import { Language, MediaProps } from '../../types'

const cls = classNameParser(styles)

const defaultValidator = () => true

export interface FinderRef {
  uploadImage: (file, callback) => void
}

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

export interface FinderProps extends MediaProps {
  language: Language
}

const Finder = forwardRef<FinderRef, FinderProps>(({
  uploadFn = defaultValidator,
  validateFn,
  accepts = defaultAccepts,
  externals = defaultExternals,
  language,
  onCancel,
  onInsert
}, ref) => {
  useImperativeHandle(ref, () => ({
    uploadImage
  }))

  const [items, setItems] = useState([])

  useEffect(() => {
    uploadItems()
  }, [items])

  const getMediaItem = id => {
    return items.find(item => item.id === id)
  }

  const getSelectedItems = () => {
    return items.filter(item => item.selected)
  }

  const addMediaItem = item => {
    addItems([item])
  }

  const addItems = newItems => {
    setItems([
      ...items,
      ...newItems
    ])
  }

  const selectMediaItem = id => {
    const item = getMediaItem(id)
    if (item && (item.uploading || item.error)) {
      return
    }
    setMediaItemState(id, {
      selected: true
    })
  }

  const selectAllItems = () => {
    setItems(items => items
      .filter(item => !item.error && !item.uploading)
      .map(item => ({ ...item, selected: true }))
    )
  }

  const deselectMediaItem = id => {
    setMediaItemState(id, {
      selected: false
    })
  }

  const deselectAllItems = () => {
    setItems(items =>
      items.map(item => ({
        ...item,
        selected: false
      })))
  }

  const removeMediaItem = id => {
    setItems(items => items.filter(item => item.id !== id))
  }

  const removeSelectedItems = () => {
    setItems(items => items.filter(item => !item.selected))
  }

  const setMediaItemState = (id, state) => {
    setItems(items => items.map(item =>
      item.id === id ? { ...item, ...state } : item
    ))
  }

  const uploadItems = (ignoreError = false) => {
    items.forEach(item => {
      if (item.uploading || item.url) {
        return
      }

      if (!ignoreError && item.error) {
        return
      }

      let uploader

      if (item.type === 'IMAGE') {
        createThumbnail(item)
        uploader = uploadFn || createInlineImage
      } else if (!uploadFn) {
        setMediaItemState(item.id, { error: 1 })
        return
      }

      setMediaItemState(item.id, {
        uploading: true,
        uploadProgress: 0,
        error: 0
      })

      uploader?.({
        id: item.id,
        file: item.file,
        success: res => {
          handleUploadSuccess(item.id, res)
        },
        progress: progress => {
          setMediaItemState(item.id, {
            uploading: true,
            uploadProgress: progress
          })
        },
        error: () => {
          setMediaItemState(item.id, {
            uploading: false,
            error: 2
          })
        }
      })
    })
  }

  const createThumbnail = ({ id, file }) => {
    compressImage(URL.createObjectURL(file), 226, 226)
      .then((result: any) => {
        setMediaItemState(id, { thumbnail: result.url })
      })
      .catch(console.error)
  }

  const createInlineImage = param => {
    compressImage(URL.createObjectURL(param.file), 1280, 800)
      .then((result: any) => {
        param.success({ url: result.url })
      })
      .catch(error => {
        param.error(error)
      })
  }

  const handleUploadSuccess = (id, data) => {
    setMediaItemState(id, {
      ...data,
      file: null,
      uploadProgress: 1,
      uploading: false,
      selected: false
    })

    const item = getMediaItem(data.id || id)
    item.onReady?.(item)
  }

  const uploadImage = (file, callback: Function) => {
    const fileId = new Date().getTime() + '_' + UniqueIndex()

    addMediaItem({
      type: 'IMAGE',
      id: fileId,
      file: file,
      name: fileId,
      size: file.size,
      uploadProgress: 0,
      uploading: false,
      selected: false,
      error: 0,
      onReady: callback
    })
  }

  const addResolvedFiles = (param, index, accepts) => {
    const data: any = {
      id: new Date().getTime() + '_' + UniqueIndex(),
      file: param.files[index],
      name: param.files[index].name,
      size: param.files[index].size,
      uploadProgress: 0,
      uploading: false,
      selected: false,
      error: 0,
      onReady: item => {
        param.onItemReady?.(item)
      }
    }

    if (param.files[index].type.indexOf('image/') === 0 && accepts.image) {
      data.type = 'IMAGE'
      addMediaItem(data)
    } else if (
      param.files[index].type.indexOf('video/') === 0 &&
      accepts.video
    ) {
      data.type = 'VIDEO'
      addMediaItem(data)
    } else if (
      param.files[index].type.indexOf('audio/') === 0 &&
      accepts.audio
    ) {
      data.type = 'AUDIO'
      addMediaItem(data)
    }

    setTimeout(() => {
      resolveFiles(param, index + 1, accepts).catch(console.error)
    }, 60)
  }

  const resolveFiles = async (param, index, accepts) => {
    if (index < param.files.length) {
      let validateResult = true
      if (validateFn) {
        validateResult = await validateFn(param.files[index])
      }

      if (validateResult) {
        addResolvedFiles(param, index, accepts)
      }
    } else {
      param.onAllReady?.()
    }
  }

  const dragCounter = useRef(0)
  const [draging, setDraging] = useState(false)
  const confirmable = useMemo(() => {
    return items.find(({ selected }) => selected)
  }, [items])
  const [external, setExternal] = useState({ url: '', type: 'IMAGE' })
  const [fileAccept, setFileAccept] = useState('')
  const [showExternalForm, setShowExternalForm] = useState(false)
  const [allowExternal, setAllowExternal] = useState(false)

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

  const buildItemList = () => {
    return (
      <ul className={cls('kedao-list')}>
        <li className={cls('kedao-add-item')}>
          <Icon type='add' size={50} />
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
            item.uploading
              ? (
              <div className={cls('kedao-item-uploading')}>
                <div
                  className={cls('kedao-item-uploading-bar')}
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
                <div className={cls('finder-image')}>
                  {progressMarker}
                  <img src={item.thumbnail || item.url} />
                </div>
              )
              break
            case 'VIDEO':
              previewerComponents = (
                <div className={cls('kedao-icon kedao-video')} title={item.url}>
                  {progressMarker}
                  <Icon type='movie' />
                  <span>{item.name || item.url}</span>
                </div>
              )
              break
            case 'AUDIO':
              previewerComponents = (
                <div className={cls('kedao-icon kedao-audio')} title={item.url}>
                  {progressMarker}
                  <Icon type='audiotrack' />
                  <span>{item.name || item.url}</span>
                </div>
              )
              break
            case 'EMBED':
              previewerComponents = (
                <div className={cls('kedao-icon kedao-embed')} title={item.url}>
                  {progressMarker}
                  <Icon type='code' />
                  <span>{item.name || language.finder.embed}</span>
                </div>
              )
              break
            default:
              previewerComponents = (
                <a
                  className={cls('kedao-icon kedao-file')}
                  title={item.url}
                  href={item.url}
                >
                  {progressMarker}
                  <Icon type='description' />
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
              className={cls(className.join(' '))}
              onClick={toggleSelectItem}
            >
              {previewerComponents}
              {item.selected && (
                <div className={cls('kedao-icon-selected')}>
                  <Icon type='check' size={50} color='white' />
                </div>
              )}
              <Icon
                type='audiotrack'
                data-id={item.id}
                onClick={removeItem}
                className={cls('kedao-item-remove')}
              />
              <span className={cls('kedao-item-title')}>{item.name}</span>
            </li>
          )
        })}
      </ul>
    )
  }

  const toggleSelectItem = (event) => {
    const itemId = event.currentTarget.dataset.id
    const item = getMediaItem(itemId)

    if (!item) {
      return
    }

    if (item.selected) {
      deselectMediaItem(itemId)
    } else {
      selectMediaItem(itemId)
    }
  }

  const removeItem = (event) => {
    const itemId = event.currentTarget.dataset.id
    const item = getMediaItem(itemId)

    if (!item) {
      return
    }

    removeMediaItem(itemId)

    event.stopPropagation()
  }

  const handleDragLeave = (event) => {
    event.preventDefault()
    dragCounter.current = dragCounter.current - 1
    dragCounter.current === 0 && setDraging(false)
  }

  const handleDragDrop = async (event) => {
    event.preventDefault()
    dragCounter.current = 0
    setDraging(false)
    await reslovePickedFiles(event)
  }

  const handleDragEnter = (event) => {
    event.preventDefault()
    dragCounter.current = dragCounter.current + 1
    setDraging(true)
  }

  const reslovePickedFiles = async (event) => {
    event.persist()

    const { files } = event.type === 'drop' ? event.dataTransfer : event.target

    const newAccepts = {
      ...defaultAccepts,
      ...accepts
    }

    await resolveFiles(
      {
        files: files,
        onItemReady: ({ id }) => selectMediaItem(id),
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
      const name = urlArr.length > 1 ? urlArr[0] : language.finder.unnamedItem
      url = urlArr.length > 1 ? urlArr[1] : urlArr[0]
      const thumbnail = type === 'IMAGE' ? url : null

      addItems([
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
    const selectedItems = getSelectedItems()
    deselectAllItems()
    onInsert?.(selectedItems)
  }

  return (
    <div className={cls('kedao-finder')}>
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDragDrop}
        className={cls('kedao-uploader')}
      >
        <div
          className={cls(
            'kedao-drag-uploader ' +
                          (draging || !items.length ? 'active ' : ' ') +
                          (draging ? 'draging' : '')
          )}
        >
          <span className={cls('kedao-drag-tip')}>
            <input
              accept={fileAccept}
              onChange={reslovePickedFiles}
              multiple
              type="file"
            />
            {draging ? language.finder.dropTip : language.finder.dragTip}
          </span>
        </div>
        {items.length
          ? (
          <div className={cls('kedao-list-wrap')}>
            <div className={cls('kedao-list-tools')}>
              <span onClick={selectAllItems} className={cls('kedao-select-all')}>
                <Icon type='done' />
                {language.finder.selectAll}
              </span>
              <span
                onClick={deselectAllItems}
                className={cls('kedao-deselect-all')}
                {...{ disabled: !confirmable }}
              >
                <Icon type='close' />
                {language.finder.deselect}
              </span>
              <span
                onClick={removeSelectedItems}
                className={cls('kedao-remove-selected')}
                {...{ disabled: !confirmable }}
              >
                <Icon type='remove' />
                {language.finder.removeSelected}
              </span>
            </div>
            {buildItemList()}
          </div>
            )
          : null}
        {showExternalForm && allowExternal
          ? (
          <div className={cls('kedao-add-external')}>
            <div className={cls('kedao-external-form')}>
              <div className={cls('kedao-external-input')}>
                <div>
                  <input
                    onKeyDown={confirmAddExternal}
                    value={external.url}
                    onChange={inputExternal}
                    placeholder={language.finder.externalInputPlaceHolder}
                  />
                </div>
                <button
                  type="button"
                  onClick={confirmAddExternal}
                  disabled={!external.url.trim().length}
                >
                  {language.finder.confirm}
                </button>
              </div>
              <div
                data-type={external.type}
                className={cls('kedao-switch-external-type')}
              >
                {externals.image
                  ? (
                  <button
                    type="button"
                    onClick={switchExternalType}
                    data-type="IMAGE"
                  >
                    {language.finder.image}
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
                    {language.finder.audio}
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
                    {language.finder.video}
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
                    {language.finder.embed}
                  </button>
                    )
                  : null}
              </div>
              <span className={cls('kedao-external-tip')}>
                {language.finder.externalInputTip}
              </span>
            </div>
          </div>
            )
          : null}
      </div>
      <footer className={cls('kedao-manager-footer')}>
        <div className={cls('pull-left')}>
          {allowExternal
            ? (
            <span
              onClick={toggleExternalForm}
              className={cls('kedao-toggle-external-form')}
            >
              {showExternalForm
                ? (
                <span className={cls('kedao-bottom-text')}>
                  <Icon type='add' />
                  {language.finder.addLocalFile}
                </span>
                  )
                : (
                <span className={cls('kedao-bottom-text')}>
                  <Icon type='add' />
                  {language.finder.addExternalSource}
                </span>
                  )}
            </span>
              )
            : null}
        </div>
        <div className={cls('pull-right')}>
          <button
            onClick={confirmInsert}
            className={cls('button button-insert')}
            disabled={!confirmable}
          >
            {language.finder.insert}
          </button>
          <button onClick={cancelInsert} className={cls('button button-cancel')}>
            {language.finder.cancel}
          </button>
        </div>
      </footer>
    </div>
  )
})

export default Finder
