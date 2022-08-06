
import { classNameParser } from '../../utils/style'
import React, { FC, useEffect, useState } from 'react'
import mergeClassNames from 'merge-class-names'
import styles from './style.module.scss'
import { ModalProps } from '../../types'
import { Portal } from 'react-portal'
import Icon from '../Icon'
const cls = classNameParser(styles)

const Modal: FC<ModalProps> = ({
  title,
  className,
  width,
  height,
  onCreate,
  children,
  confirmable,
  closeOnConfirm = true,
  onConfirm,
  showFooter = true,
  showCancel = true,
  showConfirm = true,
  onBlur,
  showClose = true,
  cancelText,
  onClose,
  confirmText,
  onCancel,
  closeOnBlur = true,
  bottomText,
  closeOnCancel = true,
  language,
  visible: outerVisible = true
}) => {
  const [visible, setVisible] = useState(outerVisible)
  useEffect(() => {
    setVisible(outerVisible)
  }, [outerVisible])

  useEffect(() => onCreate?.(), [])

  const handleMouseDown = (event) => {
    const tagName = event.target.tagName.toLowerCase()

    if (tagName === 'input' || tagName === 'textarea') {
      return false
    }

    event.preventDefault()
    return true
  }

  const handleClose = () => {
    setVisible(false)
    onClose?.()
  }

  const handleCancel = () => {
    if (closeOnCancel) {
      setVisible(false)
    }
    onCancel?.()
  }
  const handleConfirm = () => {
    if (closeOnConfirm) {
      setVisible(false)
    }
    onConfirm?.()
  }

  const handleBlur = () => {
    onBlur?.()
    if (closeOnBlur) {
      handleClose()
    }
  }

  if (!visible) {
    return null
  }

  return (
    <Portal>
      <div
        role="presentation"
        onMouseDown={handleMouseDown}
        className={cls(`kedao-modal ${className || ''}`)}
      >
        <div
          role="presentation"
          className={cls('kedao-modal-mask')}
          onClick={handleBlur}
        />
        <div style={{ width, height }} className={cls('kedao-modal-content')}>
          <div className={cls('kedao-modal-header')}>
            <h3 className={cls('kedao-modal-caption')}>{title}</h3>
            {showClose && (
              <button
                type="button"
                onClick={handleClose}
                className={cls('kedao-modal-close-button')}
              >
                <Icon type='close' />
              </button>
            )}
          </div>
          <div className={cls('kedao-modal-body')}>{children}</div>
          {showFooter
            ? (
            <div className={cls('kedao-modal-footer')}>
              <div className={cls('kedao-modal-addon-text')}>{bottomText}</div>
              <div className={cls('kedao-modal-buttons')}>
                {showCancel && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className={cls('kedao-modal-cancel')}
                  >
                    {cancelText || language.base.cancel}
                  </button>
                )}
                {showConfirm && (
                  <button
                    type="button"
                    onClick={handleConfirm}
                    className={cls(mergeClassNames(
                      'kedao-modal-confirm',
                      !confirmable && 'disabled'
                    ))}
                  >
                    {confirmText || language.base.confirm}
                  </button>
                )}
              </div>
            </div>
              )
            : null}
        </div>
      </div>
    </Portal>
  )
}

export default Modal
