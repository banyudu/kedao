import React from "react";
import ReactDOM from "react-dom";
import Finder, { ImageUtils } from "../src";

class Demo extends React.Component {
  constructor(props) {
    super(props);
    this.finder = new Finder({
      language: "pl"
    });
  }

  beforeRemove = items => {
    return confirm("确认删除这些项目?");
  };

  handelFileSelect = files => {
    return [].slice.call(files, 0, 3);
  };

  render() {
    const FinderComponent = this.finder.ReactComponent;

    return (
      <div className="demo">
        <FinderComponent
          accepts={{
            audio: false,
            video: false
          }}
          language="ru"
          onSelect={item => console.log("seleced:", item)}
          onBeforeSelect={item => console.log("will select:", item)}
          onDeselect={item => console.log("deselected:", item)}
          onBeforeDeselect={item => console.log("will deselect:", item)}
          onInsert={items => console.log("insert:", items)}
          onBeforeInsert={items => console.log("will insert:", items)}
          onRemove={items => console.log("removed", items)}
          onBeforeRemove={this.beforeRemove}
          onFileSelect={this.handelFileSelect}
        />
      </div>
    );
  }
}

ReactDOM.render(<Demo />, document.querySelector("#root"));
