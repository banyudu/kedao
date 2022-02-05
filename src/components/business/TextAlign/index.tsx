import React from 'react'
import { v4 as uuidv4 } from 'uuid'
import { ContentUtils } from '../../../utils'
import mergeClassNames from 'merge-class-names'
import ControlGroup from '../ControlGroup'
import {
  MdFormatAlignCenter,
  MdFormatAlignJustify,
  MdFormatAlignLeft,
  MdFormatAlignRight,
} from 'react-icons/md'
import { defaultIconProps } from '../../../configs/props'

const iconMap = {
  left: <MdFormatAlignLeft {...defaultIconProps } />,
  center: <MdFormatAlignCenter {...defaultIconProps } />,
  right: <MdFormatAlignRight {...defaultIconProps } />,
  justify: <MdFormatAlignJustify {...defaultIconProps } />,
}

class TextAlign extends React.Component<any, any> {
  state = {
    currentAlignment: undefined
  };

  UNSAFE_componentWillReceiveProps (next) {
    this.setState({
      currentAlignment: ContentUtils.getSelectionBlockData(
        next.editorState,
        'textAlign'
      )
    })
  }

  setAlignment = (event) => {
    let { alignment } = event.currentTarget.dataset
    const hookReturns = this.props.hooks(
      'toggle-text-alignment',
      alignment
    )(alignment)

    if (this.props.textAligns.indexOf(hookReturns) > -1) {
      alignment = hookReturns
    }

    this.props.editor.setValue(
      ContentUtils.toggleSelectionAlignment(this.props.editorState, alignment)
    )
    this.props.editor.requestFocus()
  };

  render () {
    const textAlignmentTitles = [
      this.props.language.controls.alignLeft,
      this.props.language.controls.alignCenter,
      this.props.language.controls.alignRight,
      this.props.language.controls.alignJustify
    ]

    return (
      <ControlGroup>
        {this.props.textAligns.map((item, index) => (
          <button
            type="button"
            key={uuidv4()}
            data-title={textAlignmentTitles[index]}
            data-alignment={item}
            className={mergeClassNames(
              'control-item button',
              item === this.state.currentAlignment && 'active'
            )}
            onClick={this.setAlignment}
          >
            {iconMap[item] ?? null}
          </button>
        ))}
      </ControlGroup>
    )
  }
}

export default TextAlign
