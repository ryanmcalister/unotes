import React, { Component } from 'react';
import Editor from 'tui-editor'
import 'tui-editor/dist/tui-editor.css'
import 'tui-editor/dist/tui-editor-contents.css'
import 'codemirror/lib/codemirror.css'
import 'highlight.js/styles/github.css'

class TuiEditor extends Component {

  constructor(props) {
    super(props);
    this.el = React.createRef();
  }

  componentDidMount() {
    
    let editor = new Editor({
      el: this.el.current,
      initialEditType: 'wysiwyg',
      previewStyle: 'vertical',
      height: window.innerHeight - 20,
      events: {
        change: this.onChange
      },
      usageStatistics: false
    });

    this.setState({ editor });
  }

  onChange = (event) => {
    console.log(this.state.editor.getValue());
  }

  render() {
    return (
      //<div ref={el => this.el = el} />
      <div ref={this.el} />
    );
  }
}

export default TuiEditor;
