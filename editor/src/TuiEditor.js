import React, { Component } from 'react';
import Editor from 'tui-editor/dist/tui-editor-Editor-all';
import 'tui-editor/dist/tui-editor.css';
import 'tui-editor/dist/tui-editor-contents.css';
import 'codemirror/lib/codemirror.css';
import 'highlight.js/styles/github.css';
import './override-light.css';
import './override-contents-light.css';
import './override.css';
import './override-contents.css';
import './override-codemirror.css';
import './override-codemirror-light.css';
import './override-hljs.css';
import remark from 'remark';
import unotesRemarkPlugin from './unotesRemarkPlugin';
import { debounce } from 'debounce';

// root for local images
var img_root = '';

function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|[]\/\\])/g, "\\$1");
}

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

Editor.defineExtension('unotes', function () {
    const defaultRenderer = Editor.markdownit.renderer.rules.image;
    const httpRE = /^https?:\/\/|^data:/;
    const imgFunc = function (tokens, idx, options, env, self) {
        const token = tokens[idx]
        const srcIndex = token.attrIndex('src');
        const altIndex = token.attrIndex('alt');
        const ttlIndex = token.attrIndex('title');
        if (srcIndex < 0 || httpRE.test(token.attrs[srcIndex][1])) {
            return defaultRenderer(tokens, idx, options, env, self);
        }
        const src = ' src="' + img_root + token.attrs[srcIndex][1] + '"';
        // check for empty alt but a content string
        let altstr = altIndex >= 0 ? token.attrs[altIndex][1] : ''
        if (!altstr && token.content)
            altstr = token.content;   // replace with content
        const alt = ' alt="' + altstr + '"';
        const ttl = ' title="' + (ttlIndex >= 0 ? token.attrs[ttlIndex][1] : '') + '"';
        const img = `<img${src}${alt}${ttl} />`;
        return img;
    };

    Editor.markdownit.renderer.rules.image = imgFunc;
    Editor.markdownitHighlight.renderer.rules.image = imgFunc;
});

class TuiEditor extends Component {

    constructor(props) {
        super(props);
        this.el = React.createRef();
        this.handleResizeMessage = debounce(this.handleResizeMessage.bind(this), 1000);
        this.onHtmlBefore = this.onHtmlBefore.bind(this);
        this.onAfterMarkdown = this.onAfterMarkdown.bind(this);
        this.onPreviewBeforeHook = this.onPreviewBeforeHook.bind(this);
        this.handleMessage = this.handleMessage.bind(this);
        this.remarkSettings = null;
        this.contentSet = false;
        this.contentPath = null;
        this.wysiwygScroll = {};
        this.markdownScroll = {};

        this.state = {
            settings: {
                display2X: false
            }
        }
    }

    componentDidMount() {

        let editor = new Editor({
            el: this.el.current,
            initialEditType: 'wysiwyg',
            previewStyle: 'vertical',
            height: window.innerHeight - 20,
            events: {
                change: debounce(this.onChange.bind(this), 400)
            },
            usageStatistics: false,
            useCommandShortcut: false,
            exts: ['scrollSync', 'chart', 'uml', 'unotes'],
            toolbarItems: [
                'heading',
                'bold',
                'italic',
                'strike',
                'divider',
                'hr',
                'quote',
                'divider',
                'ul',
                'ol',
                'task',
                'indent',
                'outdent',
                'divider',
                'table',
                'image',
                'link',
                'divider',
                'code',
                'codeblock'
            ]
            
        });

        editor.on("convertorBeforeHtmlToMarkdownConverted", this.onHtmlBefore);

        editor.on("convertorAfterHtmlToMarkdownConverted", this.onAfterMarkdown)

        editor.on("previewBeforeHook", this.onPreviewBeforeHook);

        editor.on("addImageBlobHook", this.onPaste.bind(this));

        editor.addHook("scroll", this.onScroll.bind(this));

        window.addEventListener('message', this.handleMessage);

        window.addEventListener('resize', this.handleResizeMessage);

        this.setState({ editor });

        window.vscode.postMessage({
            command: 'editorOpened'
        });
    }

    onHtmlBefore(e) {
        return replaceAll(e, img_root, '');
    }

    onAfterMarkdown(e) {
        if(this.remarkSettings){
            // Reformat markdown
            // console.log("from...")
            // console.log(e);
            const md = remark().use({
                    settings: this.remarkSettings
                })
                .use(this.remarkPlugin)
                .processSync(e).contents;
            // console.log("to...")
            // console.log(md);

            return md;
        }
        return e;
    }

    onPreviewBeforeHook(e) {
        //console.log(e);
        return e;
    }

    onScroll(e) {
        if(!this.contentPath)
            return;

        // save the scroll positions
        if(this.state.editor.isWysiwygMode() && e.data){
            this.wysiwygScroll[this.contentPath] = this.state.editor.getCurrentModeEditor().scrollTop(); 
        
        } else {
            this.markdownScroll[this.contentPath] = this.state.editor.getCurrentModeEditor().scrollTop(); 
        }
    }

    onPaste(e) {
        const toBase64 = file => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });

        if(!this.state.settings.convertPastedImages){
            return;
        }

        return toBase64(e)
        .then(result => {
            window.vscode.postMessage({
                command: 'convertImage',
                data: result
            });
            return null;
        });
    }

    componentWillUnmount() {
        window.removeEventListener('message', this.handleMessage.bind(this));
        window.removeEventListener('resize', this.handleResizeMessage);
    }

    handleResizeMessage(e) {
        window.vscode.postMessage({
            command: 'resized'
        });
    }

    setContent(data){
        img_root = data.folderPath + '/';
        this.state.editor.setMarkdown(data.content, false);
        this.contentSet = true;
        
        const isSamePath = (this.contentPath === data.contentPath);
        this.contentPath = data.contentPath;
        if (!isSamePath){
            const scrolls = this.state.editor.isWysiwygMode() ? this.wysiwygScroll : this.markdownScroll;
            let sTop = scrolls[this.contentPath];
            if(!sTop){
                sTop = 0;    
            } 
            this.state.editor.scrollTop(sTop);
        } 
    }

    handleMessage(e) {
        switch (e.data.command) {
            case 'setContent':
                this.setContent(e.data);
                break;
            case 'exec':
                this.state.editor.exec(...e.data.args);
                break;
            case 'settings':
                this.setState({ settings: e.data.settings });
                break;
            case 'remarkSettings':
                this.remarkSettings = e.data.settings;
                this.remarkPlugin = unotesRemarkPlugin(this.remarkSettings);
                break;
            case 'toggleMode':
                if(!this.state.editor.isWysiwygMode()){
                    this.state.editor.getUI().getModeSwitch()._changeWysiwyg();
                } else {
                    this.state.editor.getUI().getModeSwitch()._changeMarkdown();
                }
                break;
            default:
        }

    }

    onChange = (event) => {
        if(!this.contentSet){
            // prevent saving empty file
            console.log("Prevented saving empty file.");
            return;
        }
        window.vscode.postMessage({
            command: 'applyChanges',
            content: this.state.editor.getValue()
        });
    }

    render() {
        return (
            <div className={(this.state.settings.display2X) ? "display2X" : "display1X"} id="editor" ref={this.el} />
        );
    }
}

export default TuiEditor;
