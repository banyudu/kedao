import React, { useEffect, useRef, FC } from 'react'
import ReactDOM from 'react-dom'
import { BaseUtils } from '../../../utils'
import mergeClassNames from 'merge-class-names'
import './style.scss'
import { MdClose } from 'react-icons/md'
import { defaultIconProps } from '../../../configs/props'
import { Language } from '../../../types'

interface ModalProps {
  title?: string
  className?: string
  width?: number
  height?: number
  component?: React.ReactNode
  confirmable?: boolean
  closeOnConfirm?: boolean
  onConfirm?: () => void
  showFooter?: boolean
  showCancel?: boolean
  showConfirm?: boolean
  onBlur?: () => void
  showClose?: boolean
  cancelText?: string
  onClose?: () => void
  confirmText?: string
  onCancel?: () => void
  closeOnBlur?: boolean
  bottomText?: React.ReactNode
  closeOnCancel?: boolean
  language: Language
  visible?: boolean
}

export const showModal = (props: ModalProps) => {
  const hostNode = document.createElement('div')
  const newProps = {
    visible: true,
    closeOnConfirm: true,
    closeOnCancel: true,
    ...props
  }

  hostNode.style.display = 'none'
  document.body.appendChild(hostNode)

  const close = () => {
    if (ReactDOM.unmountComponentAtNode(hostNode)) {
      hostNode.parentNode.removeChild(hostNode)
    }
  }

  const onConfirm = () => {
    newProps.onConfirm?.()
  }

  const onCancel = () => {
    newProps.onCancel?.()
  }

  const onClose = () => {
    close()
    newProps.onClose?.()
  }

  // eslint-disable-next-line react/no-render-return-value
  const modalInstance: any = ReactDOM.render(
    <Modal
      {...newProps}
      onConfirm={onConfirm}
      onCancel={onCancel}
      onClose={onClose}
    />,
    hostNode
  )
  modalInstance.destroy = close
  modalInstance.update = modalInstance.renderComponent

  return modalInstance
}

const Modal: FC<ModalProps> = ({
  title,
  className,
  width,
  height,
  children,
  component,
  confirmable,
  closeOnConfirm,
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
  closeOnCancel,
  language,
  visible
}) => {
  const active = useRef(false)
  const activeId = useRef(null)
  const rootElement = useRef(null)
  const componentId = useRef(`KEDAO-MODAL-${BaseUtils.UniqueIndex()}`)

  useEffect(() => {
    if (visible) {
      active.current = true
      renderComponent()
    }
  }, [])

  useEffect(() => {
    if (!visible) {
      unrenderComponent()
    } else {
      renderComponent()
    }
  }, [visible])

  const handleTransitionEnd = () => {
    if (!rootElement.current?.classList) {
      return false
    }

    if (!rootElement.current.classList.contains('active')) {
      if (ReactDOM.unmountComponentAtNode(rootElement.current)) {
        rootElement.current.parentNode.removeChild(rootElement.current)
      }
    }
    return true
  }

  const handleMouseDown = (event) => {
    const tagName = event.target.tagName.toLowerCase()

    if (tagName === 'input' || tagName === 'textarea') {
      return false
    }

    event.preventDefault()
    return true
  }

  const handleCancel = () => {
    if (closeOnCancel) {
      close()
    }
    onCancel?.()
  }

  const handleConfirm = () => {
    if (closeOnConfirm) {
      close()
    }
    if (onConfirm) {
      onConfirm()
    }
  }

  const handleMaskClick = () => {
    if (closeOnBlur) {
      close()
    }
    onBlur?.()
  }

  const close = () => {
    unrenderComponent()
    onClose?.()
  }

  const unrenderComponent = () => {
    active.current = false
    if (activeId.current) {
      window.clearImmediate(activeId.current)
    }
    if (rootElement.current?.classList) {
      rootElement.current.classList.remove('active')
    }
  }

  const renderComponent = () => {
    if (!active) {
      return false
    }

    const childComponent = (
      <div
        role="presentation"
        onMouseDown={handleMouseDown}
        className={`bf-modal ${className || ''}`}
      >
        <div
          role="presentation"
          className="bf-modal-mask"
          onClick={handleMaskClick}
        />
        <div
          onTransitionEnd={handleTransitionEnd}
          style={{ width, height }}
          className="bf-modal-content"
        >
          <div className="bf-modal-header">
            <h3 className="bf-modal-caption">{title}</h3>
            {showClose && (
              <button
                type="button"
                onClick={close}
                className="bf-modal-close-button"
              >
                <MdClose {...defaultIconProps} />
              </button>
            )}
          </div>
          <div className="bf-modal-body">{children || component}</div>
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
    )

    rootElement.current = document.querySelector(`#${componentId.current}`)

    if (!rootElement.current) {
      rootElement.current = document.createElement('div')
      rootElement.current.id = componentId.current
      rootElement.current.className = 'bf-modal-root'
      document.body.appendChild(rootElement.current)
    }

    ReactDOM.render(childComponent, rootElement.current)

    activeId.current = window.setImmediate(() => {
      rootElement.current.classList.add('active')
    })
    return true
  }

  return null
}

export default Modal
