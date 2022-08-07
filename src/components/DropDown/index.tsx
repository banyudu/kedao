
import { classNameParser } from '../../utils/style'
import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
  useCallback
} from 'react'
import mergeClassNames from 'merge-class-names'
import styles from './style.module.scss'
import { useClickOutside, usePrevious, useSyncedRef, useWindowSize } from '@react-hookz/web'
import Icon from '../Icon'
const cls = classNameParser(styles)

export interface DropDownProps {
  disabled?: boolean
  autoHide: boolean
  caption: React.ReactNode
  htmlCaption?: string
  title: string
  showArrow?: boolean
  arrowActive?: boolean
  className?: string
  isActive?: boolean
  onActiveChage?: (value: boolean) => void
  getContainerNode: () => HTMLElement
  children: React.ReactNode
}

const DropDown = forwardRef<any, DropDownProps>(
  (
    {
      disabled,
      autoHide,
      getContainerNode,
      caption,
      htmlCaption,
      title,
      showArrow,
      arrowActive,
      isActive,
      onActiveChage,
      className,
      children
    },
    ref
  ) => {
    const latestIsActive = useSyncedRef(isActive)
    const [activeState, setActive] = useState(false)
    const active =
      latestIsActive.current === undefined
        ? activeState
        : latestIsActive.current // 兼容受控与非受控

    const [offset, setOffset] = useState(0)
    const dropDownHandlerElement = useRef<HTMLButtonElement>(null)
    const dropDownContentElement = useRef<HTMLDivElement>(null)
    const size = useWindowSize()

    const fixDropDownPosition = () => {
      const viewRect = getContainerNode().getBoundingClientRect()
      const handlerRect =
        dropDownHandlerElement.current?.getBoundingClientRect()
      const contentRect =
        dropDownContentElement.current?.getBoundingClientRect()

      let newOffset = 0
      let right =
        handlerRect.right - handlerRect.width / 2 + contentRect.width / 2
      let left =
        handlerRect.left + handlerRect.width / 2 - contentRect.width / 2

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

    useEffect(fixDropDownPosition, [size])

    useEffect(() => {
      if (disabled) {
        hide()
      }
    }, [disabled])

    const previousActive = usePrevious(active)
    useEffect(() => {
      if (active && active !== previousActive) {
        fixDropDownPosition()
      }
    }, [active])

    const autoHideHandler = useCallback(() => {
      if (autoHide && active) {
        hide()
      }
    }, [autoHide, active])

    useClickOutside(dropDownContentElement, autoHideHandler)

    const toggle = () => {
      onActiveChage?.(!active)
      setActive((active) => !active)
    }

    const hide = () => {
      onActiveChage?.(false)
      setActive(false)
    }

    useImperativeHandle(
      ref,
      () => {
        return { hide, toggle }
      },
      [hide, toggle]
    )

    return (
      <div
        className={cls(mergeClassNames(
          'kedao-dropdown',
          !disabled && active && 'active',
          disabled && 'disabled',
          className
        ))}
      >
        {htmlCaption
          ? (
          <button
            type="button"
            className={cls('dropdown-handler')}
            data-title={title}
            aria-label="Button"
            onClick={toggle}
            dangerouslySetInnerHTML={
              htmlCaption ? { __html: htmlCaption } : null
            }
            ref={dropDownHandlerElement}
          />
            )
          : (
          <button
            type="button"
            className={cls('dropdown-handler')}
            data-title={title}
            onClick={toggle}
            ref={dropDownHandlerElement}
          >
            <span>{caption}</span>
            {showArrow ? <Icon type='arrow-drop-down' /> : null}
          </button>
            )}
        <div
          className={cls('dropdown-content')}
          style={{ marginLeft: offset }}
          ref={dropDownContentElement}
        >
          <i
            style={{ marginLeft: offset * -1 }}
            className={cls(mergeClassNames(
              'dropdown-arrow',
              arrowActive && 'active'
            ))}
          />
          <div className={cls('dropdown-content-inner')}>{children}</div>
        </div>
      </div>
    )
  }
)

export default DropDown
