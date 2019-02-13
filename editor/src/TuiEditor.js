import React, { Component } from 'react';
import Editor from 'tui-editor/dist/tui-editor-Editor-all';
import 'tui-editor/dist/tui-editor.css';
import 'tui-editor/dist/tui-editor-contents.css';
import 'codemirror/lib/codemirror.css';
import 'highlight.js/styles/github.css';
import './override.css'
import './override-contents.css'
import './override-codemirror.css'

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
      usageStatistics: false,
      exts: ['scrollSync', 'colorSyntax', 'chart', 'uml']
    });

    editor.setMarkdown("Hello!!!");

    window.addEventListener('message', this.handleMessage.bind(this));

    this.setState({ editor });
  }

  componentWillUnmount() {
    window.removeEventListener('message', this.handleMessage)
  }

  handleMessage(e) {
    switch(e.data.command){
      case 'setContent':
        this.state.editor.setMarkdown(e.data.content);
        break;

      default:
    }
    
  }

  onChange = (event) => {
    //console.log(this.state.editor.getValue());
    window.vscode.postMessage({
      command: 'applyChanges',
      content: this.state.editor.getValue()
    });
  }

  render() {
    return (
      //<div ref={el => this.el = el} />
      <div ref={this.el} />
    );
  }
}

export default TuiEditor;
