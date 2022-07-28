import React, { FC, useEffect, useState } from 'react'
import mergeClassNames from 'merge-class-names'
import './style.scss'
import { MdClose } from 'react-icons/md'
import { defaultIconProps } from '../../../configs/props'
import { ModalProps } from '../../../types'
import { Portal } from 'react-portal'

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
        className={`bf-modal ${className || ''}`}
      >
        <div
          role="presentation"
          className="bf-modal-mask"
          onClick={handleBlur}
        />
        <div style={{ width, height }} className="bf-modal-content">
          <div className="bf-modal-header">
            <h3 className="bf-modal-caption">{title}</h3>
            {showClose && (
              <button
                type="button"
                onClick={handleClose}
                className="bf-modal-close-button"
              >
                <MdClose {...defaultIconProps} />
              </button>
            )}
          </div>
          <div className="bf-modal-body">{children}</div>
          {showFooter
            ? (
            <div className="bf-modal-footer">
              <div className="bf-modal-addon-text">{bottomText}</div>
              <div className="bf-modal-buttons">
                {showCancel && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="bf-modal-cancel"
                  >
                    {cancelText || language.base.cancel}
                  </button>
                )}
                {showConfirm && (
                  <button
                    type="button"
                    onClick={handleConfirm}
                    className={mergeClassNames(
                      'bf-modal-confirm',
                      !confirmable && 'disabled'
                    )}
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
