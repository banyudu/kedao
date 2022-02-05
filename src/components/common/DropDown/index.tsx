import React from 'react'
import mergeClassNames from 'merge-class-names'

import ResponsiveHelper from '../../../helpers/responsive'

import './style.scss'

class DropDown extends React.Component<any, any> {
  state = {
    active: false,
    offset: 0
  };

  componentDidMount () {
    if (document) {
      document.body.addEventListener('click', this.registerClickEvent)
      this.responsiveResolveId = ResponsiveHelper.resolve(
        this.fixDropDownPosition
      ) as any
    }
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps (next) {
    if (!this.props.disabled && next.disabled) {
      this.hide()
    }
  }

  componentDidUpdate (prevState) {
    if (!prevState.active && this.state.active) {
      this.fixDropDownPosition()
    }
  }

  componentWillUnmount () {
    if (document) {
      document.body.removeEventListener('click', this.registerClickEvent)
      ResponsiveHelper.unresolve(this.responsiveResolveId)
    }
  }

  responsiveResolveId = React.createRef();

  dropDownHandlerElement = React.createRef<HTMLButtonElement>();

  dropDownContentElement = React.createRef<HTMLDivElement>();

  fixDropDownPosition = () => {
    const viewRect = this.props.getContainerNode().getBoundingClientRect()
    const handlerRect = this.dropDownHandlerElement.current?.getBoundingClientRect()
    const contentRect = this.dropDownContentElement.current?.getBoundingClientRect()

    let offset = 0
    let right =
      handlerRect.right - handlerRect.width / 2 + contentRect.width / 2
    let left = handlerRect.left + handlerRect.width / 2 - contentRect.width / 2

    right = viewRect.right - right
    left -= viewRect.left

    if (right < 10) {
      offset = right - 10
    } else if (left < 10) {
      offset = left * -1 + 10
    }

    if (offset !== this.state.offset) {
      this.setState({ offset })
    }
  };

  registerClickEvent = (event) => {
    const { autoHide } = this.props
    const { active } = this.state

    if (
      this.dropDownContentElement.current?.contains(event.target) ||
      this.dropDownHandlerElement.current?.contains(event.target)
    ) {
      return false
    }

    if (autoHide && active) {
      this.hide()
    }
    return true
  };

  toggle = () => {
    this.setState((prevState) => ({
      active: !prevState.active
    }))
  };

  show = () => {
    this.setState({ active: true })
  };

  hide = () => {
    this.setState({ active: false })
  };

  render () {
    const { active, offset } = this.state
    const {
      caption,
      htmlCaption,
      title,
      disabled,
      showArrow,
      arrowActive,
      className,
      children
    } = this.props

    return (
      <div
        className={mergeClassNames(
          'bf-dropdown',
          !disabled && active && 'active',
          disabled && 'disabled',
          className
        )}
      >
        {htmlCaption
          ? (
          <button
            type="button"
            className="dropdown-handler"
            data-title={title}
            aria-label="Button"
            onClick={this.toggle}
            dangerouslySetInnerHTML={
              htmlCaption ? { __html: htmlCaption } : null
            }
            ref={this.dropDownHandlerElement}
          />
            )
          : (
          <button
            type="button"
            className="dropdown-handler"
            data-title={title}
            onClick={this.toggle}
            ref={this.dropDownHandlerElement}
          >
            <span>{caption}</span>
            {showArrow !== false ? <i className="bfi-drop-down" /> : null}
          </button>
            )}
        <div
          className="dropdown-content"
          style={{ marginLeft: offset }}
          ref={this.dropDownContentElement}
        >
          <i
            style={{ marginLeft: offset * -1 }}
            className={mergeClassNames(
              'dropdown-arrow',
              arrowActive && 'active'
            )}
          />
          <div className="dropdown-content-inner">{children}</div>
        </div>
      </div>
    )
  }
}

export default DropDown
