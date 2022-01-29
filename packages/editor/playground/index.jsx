import React from 'react';
import ReactDOM from 'react-dom';
import Editor from '../dist_old/index';

import '@kedao/extensions/dist/emoticon.css';
import '@kedao/extensions/dist/color-picker.css';
import '@kedao/extensions/dist/table.css';
import '@kedao/extensions/dist/code-highlighter.css';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
    };
  }

  handleChange = (editorState) => {
    console.log('change');
    this.setState({ editorState });
  };

  logHTML = () => {
    console.log(this.state.editorState.toHTML());
  };

  logRAW = () => {
    console.log(this.state.editorState.toRAW());
  };

  render() {
    // const { readOnly, editorState } = this.state;

    return (
      <div>
        <div className="demo" id="demo">
          11111
          <Editor
            // colors={['#e25041']}
            // headings={['header-one', 'unstyled']}
            placeholder="Hello World!"
            // fixPlaceholder
            // allowInsertLinkText
            // triggerChangeOnMount={false}
            // value={editorState}
            // onChange={this.handleChange}
            // readOnly={readOnly}
            // hooks={hooks}
            // imageResizable
            // imageEqualRatio
          />
        </div>
      </div>
    );
  }
}

ReactDOM.render(<App />, document.querySelector('#root'));
