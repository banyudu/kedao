import React, { useState, useEffect, useRef, forwardRef } from 'react'
import mergeClassNames from 'merge-class-names'
import ResponsiveHelper from '../../../helpers/responsive'
import './style.scss'
import { MdArrowDropDown } from 'react-icons/md'
import { defaultIconProps } from '../../../configs/props'

const DropDown = forwardRef<any, any>(({
  disabled,
  autoHide,
  getContainerNode,
  caption,
  htmlCaption,
  title,
  showArrow,
  arrowActive,
  className,
  children
}, ref) => {
  const [active, setActive] = useState(false)
  const [offset, setOffset] = useState(0)
  const responsiveResolveId = useRef(null)
  const dropDownHandlerElement = useRef<HTMLButtonElement>(null)
  const dropDownContentElement = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (document) {
      document.body.addEventListener('click', registerClickEvent)
      responsiveResolveId.current = ResponsiveHelper.resolve(
        fixDropDownPosition
      ) as any
    }

    return () => {
      if (document) {
        document.body.removeEventListener('click', registerClickEvent)
        ResponsiveHelper.unresolve(responsiveResolveId.current)
      }
    }
  }, [])

  useEffect(() => {
    if (disabled) {
      hide()
    }
  }, [disabled])

  useEffect(() => {
    if (active) {
      fixDropDownPosition()
    }
  }, [active])

  const fixDropDownPosition = () => {
    const viewRect = getContainerNode().getBoundingClientRect()
    const handlerRect = dropDownHandlerElement.current?.getBoundingClientRect()
    const contentRect = dropDownContentElement.current?.getBoundingClientRect()

    let newOffset = 0
    let right =
      handlerRect.right - handlerRect.width / 2 + contentRect.width / 2
    let left = handlerRect.left + handlerRect.width / 2 - contentRect.width / 2

    right = viewRect.right - right
    left -= viewRect.left

    if (right < 10) {
      newOffset = right - 10
    } else if (left < 10) {
      newOffset = left * -1 + 10
    }

    if (newOffset !== offset) {
      setOffset(newOffset)
    }
  }

  const registerClickEvent = event => {
    if (
      dropDownContentElement.current?.contains(event.target) ||
      dropDownHandlerElement.current?.contains(event.target)
    ) {
      return false
    }

    if (autoHide && active) {
      hide()
    }
    return true
  }

  const toggle = () => {
    setActive(active => !active)
  }

  const hide = () => {
    setActive(false)
  }

  return (
    <div
      className={mergeClassNames(
        'bf-dropdown',
        !disabled && active && 'active',
        disabled && 'disabled',
        className
      )}
      ref={ref}
    >
      {
        htmlCaption
          ? (
            <button
              type='button'
              className='dropdown-handler'
              data-title={title}
              aria-label='Button'
              onClick={toggle}
              dangerouslySetInnerHTML={htmlCaption ? { __html: htmlCaption } : null}
              ref={dropDownHandlerElement}
            />
            )
          : (
            <button
              type='button'
              className='dropdown-handler'
              data-title={title}
              onClick={toggle}
              ref={dropDownHandlerElement}
            >
              <span>{caption}</span>
              {showArrow !== false
                ? (
                <MdArrowDropDown {...defaultIconProps} />
                  )
                : null}
            </button>
            )}
      <div
        className='dropdown-content'
        style={{ marginLeft: offset }}
        ref={dropDownContentElement}
      >
        <i
          style={{ marginLeft: offset * -1 }}
          className={mergeClassNames('dropdown-arrow', arrowActive && 'active')}
        />
        <div className='dropdown-content-inner'>{children}</div>
      </div>
    </div>
  )
})

export default DropDown
