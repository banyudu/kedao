import React from 'react'
import { ContentUtils } from '../../../utils'

import ControlGroup from '..//ControlGroup'

class TextIndent extends React.Component<any, any> {
  state = {
    currentIndent: 0
  };

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps (nextProps) {
    this.setState({
      currentIndent:
        ContentUtils.getSelectionBlockData(
          nextProps.editorState,
          'textIndent'
        ) || 0
    })
  }

  increaseIndent = () => {
    this.props.editor.setValue(
      ContentUtils.increaseSelectionIndent(this.props.editorState)
    )
    this.props.editor.requestFocus()
  };

  decreaseIndent = () => {
    this.props.editor.setValue(
      ContentUtils.decreaseSelectionIndent(this.props.editorState)
    )
    this.props.editor.requestFocus()
  };

  render () {
    const { currentIndent } = this.state
    const { language } = this.props

    return (
      <ControlGroup>
        <button
          key={0}
          type="button"
          data-title={language.controls.increaseIndent}
          disabled={currentIndent >= 6}
          className={`control-item button button-indent-increase${
            currentIndent > 0 && currentIndent < 6 ? ' active' : ''
          }`}
          onClick={this.increaseIndent}
        >
          <i className="bfi-indent-increase" />
        </button>
        <button
          key={1}
          type="button"
          data-title={language.controls.decreaseIndent}
          disabled={currentIndent <= 0}
          className="control-item button button-indent-decrease"
          onClick={this.decreaseIndent}
        >
          <i className="bfi-indent-decrease" />
        </button>
      </ControlGroup>
    )
  }
}

export default TextIndent
