import { UniqueIndex } from './utils/base'
import { compressImage } from './utils/image'

const defaultValidator = () => true

export default class FinderController {
  items: any;
  uploadFn: any;
  validateFn: any;
  changeListeners: any;

  constructor (props: any = {}) {
    this.items = props.items || []
    this.uploadFn = props.uploader
    this.validateFn = props.validator || defaultValidator

    this.changeListeners = []
  }

  setProps = (props: any = {}) => {
    this.items = props.items || this.items || []
    this.uploadFn = props.uploader
    this.validateFn = props.validator || defaultValidator
  };

  getMediaItem = (id) => {
    return this.items.find((item) => item.id === id)
  };

  getSelectedItems = () => {
    return this.items.filter((item) => item.selected)
  };

  getItems = () => {
    return this.items
  };

  setItems = (items) => {
    this.items =
      items.map((item) => ({ ...item, id: item.id.toString() })) || []
    this.applyChange()
    this.uploadItems()
  };

  addMediaItem = (item) => {
    this.addItems([item])
  };

  addItems = (items) => {
    this.items = [
      ...this.items,
      ...items.map((item) => ({ ...item, id: item.id.toString() }))
    ]
    this.applyChange()
    this.uploadItems()
  };

  selectMediaItem = (id) => {
    const item = this.getMediaItem(id)
    if (item && (item.uploading || item.error)) {
      return
    }
    this.setMediaItemState(id, {
      selected: true
    })
  };

  selectAllItems = () => {
    this.items = this.items
      .filter((item) => !item.error && !item.uploading)
      .map((item) => ({ ...item, selected: true }))
    this.applyChange()
  };

  deselectMediaItem = (id) => {
    this.setMediaItemState(id, {
      selected: false
    })
  };

  deselectAllItems = () => {
    this.items = this.items.map((item) => ({ ...item, selected: false }))
    this.applyChange()
  };

  removeMediaItem = (id) => {
    this.items = this.items.filter((item) => item.id !== id)
    this.applyChange()
  };

  removeItems = (ids = []) => {
    this.items = this.items.filter((item) => !ids.includes(item.id))
    this.applyChange()
  };

  removeSelectedItems = () => {
    this.items = this.items.filter((item) => !item.selected)
    this.applyChange()
  };

  removeErrorItems = () => {
    this.items = this.items.filter((item) => !item.error)
    this.applyChange()
  };

  removeAllItems = () => {
    this.items = []
    this.applyChange()
  };

  setMediaItemState = (id, state) => {
    this.items = this.items.map((item) =>
      item.id === id ? { ...item, ...state } : item
    )
    this.applyChange()
  };

  reuploadErrorItems = () => {
    this.uploadItems(true)
  };

  uploadItems = (ignoreError = false) => {
    this.items.forEach((item) => {
      if (item.uploading || item.url) {
        return
      }

      if (!ignoreError && item.error) {
        return
      }

      if (item.type === 'IMAGE') {
        this.createThumbnail(item)
        this.uploadFn = this.uploadFn || this.createInlineImage
      } else if (!this.uploadFn) {
        this.setMediaItemState(item.id, { error: 1 })
        return
      }

      this.setMediaItemState(item.id, {
        uploading: true,
        uploadProgress: 0,
        error: 0
      })

      this.uploadFn({
        id: item.id,
        file: item.file,
        success: (res) => {
          this.handleUploadSuccess(item.id, res)
        },
        progress: (progress) => {
          this.setMediaItemState(item.id, {
            uploading: true,
            uploadProgress: progress
          })
        },
        error: () => {
          this.setMediaItemState(item.id, {
            uploading: false,
            error: 2
          })
        }
      })
    })
  };

  createThumbnail = ({ id, file }) => {
    compressImage(URL.createObjectURL(file), 226, 226).then((result: any) => {
      this.setMediaItemState(id, { thumbnail: result.url })
    }).catch(console.error)
  };

  createInlineImage = (param) => {
    compressImage(URL.createObjectURL(param.file), 1280, 800)
      .then((result: any) => {
        param.success({ url: result.url })
      })
      .catch((error) => {
        param.error(error)
      })
  };

  handleUploadSuccess = (id, data) => {
    this.setMediaItemState(id, {
      ...data,
      file: null,
      uploadProgress: 1,
      uploading: false,
      selected: false
    })

    const item = this.getMediaItem(data.id || id)
    item.onReady?.(item)
  };

  applyChange = () => {
    this.changeListeners.forEach(({ callback }) => callback(this.items))
  };

  uploadImage = (file, callback) => {
    const fileId = new Date().getTime() + '_' + UniqueIndex()

    this.addMediaItem({
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
  };

  uploadImageRecursively = (files, callback, index = 0) => {
    if (files[index] && files[index].type.indexOf('image') > -1) {
      this.uploadImage(files[index], (image) => {
        callback?.(image)
        index < files.length - 1 &&
          this.uploadImageRecursively(files, callback, index + 1)
      })
    } else {
      index < files.length - 1 &&
        this.uploadImageRecursively(files, callback, index + 1)
    }
  };

  addResolvedFiles = (param, index, accepts) => {
    const data: any = {
      id: new Date().getTime() + '_' + UniqueIndex(),
      file: param.files[index],
      name: param.files[index].name,
      size: param.files[index].size,
      uploadProgress: 0,
      uploading: false,
      selected: false,
      error: 0,
      onReady: (item) => {
        param.onItemReady?.(item)
      }
    }

    if (param.files[index].type.indexOf('image/') === 0 && accepts.image) {
      data.type = 'IMAGE'
      this.addMediaItem(data)
    } else if (
      param.files[index].type.indexOf('video/') === 0 &&
      accepts.video
    ) {
      data.type = 'VIDEO'
      this.addMediaItem(data)
    } else if (
      param.files[index].type.indexOf('audio/') === 0 &&
      accepts.audio
    ) {
      data.type = 'AUDIO'
      this.addMediaItem(data)
    }

    setTimeout(() => {
      this.resolveFiles(param, index + 1, accepts)
    }, 60)
  };

  resolveFiles = (param, index, accepts) => {
    if (index < param.files.length) {
      const validateResult = this.validateFn(param.files[index])

      if (validateResult instanceof Promise) {
        validateResult
          .then(() => {
            this.addResolvedFiles(param, index, accepts)
          })
          .catch(console.error)
      } else if (validateResult) {
        this.addResolvedFiles(param, index, accepts)
      }
    } else {
      param.onAllReady?.()
    }
  };

  onChange = (callback) => {
    const listenerId = UniqueIndex()

    this.changeListeners.push({
      id: listenerId,
      callback: callback
    })

    return listenerId
  };

  offChange = (listenerId) => {
    this.changeListeners = this.changeListeners.filter(
      ({ id }) => id !== listenerId
    )
  };
}
