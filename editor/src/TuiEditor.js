import React, { Component } from 'react';
import Editor from '@toast-ui/editor';
import chart from '@toast-ui/editor-plugin-chart';
import uml from '@toast-ui/editor-plugin-uml';
import 'prismjs/themes/prism.css';
import '@toast-ui/editor-plugin-code-syntax-highlight/dist/toastui-editor-plugin-code-syntax-highlight.css';
import codeSyntaxHighlight from '@toast-ui/editor-plugin-code-syntax-highlight/dist/toastui-editor-plugin-code-syntax-highlight-all.js';
import '@toast-ui/editor/dist/toastui-editor.css';
import '@toast-ui/editor/dist/theme/toastui-editor-dark.css';
import 'highlight.js/styles/github.css';
import './override-light.css';
import './override-contents-light.css';
import './override.css';
import './override-contents.css';
import './override-hljs.css';
import remark from 'remark';
import gfm from 'remark-gfm';
import frontmatter from 'remark-frontmatter';
import unotesRemarkPlugin from './unotesRemarkPlugin';
import { debounce } from 'debounce';
import katex from 'katex'
import 'katex/dist/katex.min.css'
import './override-katex.css'

// root for local images
var img_root = '';

// image max width percent
var Config__img_max_width_percent = null;
var Temp__img_max_width_percent = null;

function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|[]\/\\])/g, "\\$1");
}

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

 /**
 * KATEX code block replacer
 */
 function katexReplacer(code) {
    let newHTML;

    try {
        const katex_options = {
            throwOnError: false
        };
        newHTML = katex.renderToString(code, katex_options);

    } catch (err) {
        newHTML = `Error occurred rendering katex: ${err.message}`;
    }

    return newHTML;
}

function getHTMLRenderers() {
    return {
        codeBlock(node) {
            const { fenceLength, info } = node;
            const infoWords = info ? info.split(/\s+/) : [];
            let content = node.literal;
            console.log('info',info);
            if (infoWords.length && infoWords[0].length) {
                const lang = infoWords[0];
                if (lang === 'katex') {
                    content = katexReplacer(node.literal);
                }
            }
            return [
                { type: 'openTag', tagName: 'pre'},
                { type: 'openTag', tagName: 'code' },
                { type: 'html', content },
                { type: 'closeTag', tagName: 'code' },
                { type: 'closeTag', tagName: 'pre' }
            ];
        },
        katex(node) {
            const content = katexReplacer(node.literal);
            return [
                { type: 'openTag', tagName: 'code' },
                { type: 'html', content },
                { type: 'closeTag', tagName: 'code' }
            ]
        }
    }
}

function katexPlugin(context, options) {
    return {
        toHTMLRenderers: getHTMLRenderers(context)
    }
}

class TuiEditor extends Component {

    constructor(props) {
        super(props);
        this.el = React.createRef();
        this.onBeforeConvertWysiwygToMarkdown = this.onBeforeConvertWysiwygToMarkdown.bind(this);
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
        let theme = 'light';
        if (0 < document.documentElement.getElementsByClassName("vscode-dark").length) {
            theme = 'dark';
        }
        let editor = new Editor({
            el: this.el.current,
            initialEditType: 'wysiwyg',
            previewStyle: 'vertical',
            frontMatter: true,
            minHeight: '100vh',
            height: '100vh',
            theme: theme,
            events: {
                change: debounce(this.onChange.bind(this), 400)
            },
            usageStatistics: false,
            useCommandShortcut: false,
            plugins: [chart, uml, katexPlugin, codeSyntaxHighlight],
            toolbarItems: [
                ['heading', 'bold', 'italic', 'strike'],
                ['hr', 'quote'],
                ['ul', 'ol', 'task', 'indent', 'outdent'],
                ['table', 'image', 'link'],
                ['code', 'codeblock'],
                ['scrollSync']
            ],
            customHTMLRenderer: {
                // For local images to work
                image(node, context) {
                    const { origin, entering, skipChildren } = context;
                    const result = origin();
                    skipChildren();
                    // console.log("Config__img_max_width_percent" + Config__img_max_width_percent);
                    // console.log("Temp__img_max_width_percent" + Temp__img_max_width_percent);
                    let percent = Config__img_max_width_percent;
                    if (Temp__img_max_width_percent) {
                        percent = Temp__img_max_width_percent;
                    }
                    switch (percent) {
                        case 10:
                        case 25:
                        case 50:
                        case 75:
                            result.classNames = ["maxwidth" + percent];
                            break;
                        default:
                            result.classNames = ["maxwidth100"];
                            break;
                    }
                    const httpRE = /^https?:\/\/|^data:/;
                    if (httpRE.test(node.destination)){
                        return result;
                    }
                    if (entering) {
                        if (node.destination.startsWith('/')) {
                            result.attributes.src = node.destination;
                        } else {
                            result.attributes.src = img_root + node.destination;
                        }
                    }
                    return result;
                }
            }
            
          });

        editor.on("beforeConvertWysiwygToMarkdown", this.onBeforeConvertWysiwygToMarkdown);
  
        editor.on("addImageBlobHook", this.onPaste.bind(this));

        editor.on("caretChange", this.onCaretChange.bind(this));

        window.addEventListener('message', this.handleMessage);


        this.setState({ editor });

        window.vscode.postMessage({
            command: 'editorOpened'
        });
    }


    onBeforeConvertWysiwygToMarkdown(e) {
        if(this.remarkSettings){
            // Reformat markdown
            // console.log("from...")
            // console.log(e);
            let md = remark().use({
                    settings: this.remarkSettings
                })
            if(this.remarkSettings.gfm){
                md = md.use(gfm, this.remarkSettings)
            }
            md = md.use(frontmatter, ['yaml', 'toml'])
                // .use(this.remarkPlugin)
                .processSync(e).contents;
            // console.log("to...")
            // console.log(md);

            return md;
        }
        return e;
    }

    onCaretChange(e) {
        //console.log('onCaretChange', e);
        if(!this.contentPath)
            return;

        // save the scroll positions
        if(this.state.editor.isWysiwygMode() && e){
            this.wysiwygScroll[this.contentPath] = this.state.editor.getCurrentModeEditor().getScrollTop();
            //console.log('onCaretChange:wysiwyg.scroll',this.contentPath,this.wysiwygScroll[this.contentPath]);
        } else {
            this.markdownScroll[this.contentPath] = this.state.editor.getCurrentModeEditor().getScrollTop(); 
            //console.log('onCaretChange:markdown.scroll',this.contentPath,this.markdownScroll[this.contentPath]);
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
                path: e.path,
                data: result
            });
            return null;
        });
    }

    componentWillUnmount() {
        window.removeEventListener('message', this.handleMessage.bind(this));
    }

    setContent(data, fileHash, savedHash){
        //console.log('this.contentPath', this.contentPath);
        //console.log('data.contentPath', data.contentPath);
        //console.log('fileHash', fileHash);
        //console.log('savedHash', savedHash);
        img_root = data.folderPath + '/';
        Config__img_max_width_percent = data.percent;
        const isSamePath = (this.contentPath === data.contentPath);
        //console.log('isSamePath', isSamePath);
        if ((!isSamePath) ||
            (fileHash !== savedHash)) {
            this.state.editor.setMarkdown(data.content, false);
            this.contentSet = true;
        }
        this.contentPath = data.contentPath;
        if (!isSamePath){
            const scrolls = this.state.editor.isWysiwygMode() ? this.wysiwygScroll : this.markdownScroll;
            let sTop = scrolls[this.contentPath];
            if(!sTop){
                sTop = 0;    
            } 
            //console.log('sTop', this.contentPath, sTop);
            this.state.editor.setScrollTop(sTop);
        }
    }

    handleMessage(e) {
        switch (e.data.command) {
            case 'setContent':
                this.setContent(e.data, e.data.fileHash, e.data.savedHash);
                break;
            case 'exec':
                this.state.editor.exec(...e.data.args);
                break;
            case 'settings':
                this.setState({ settings: e.data.settings });
                Config__img_max_width_percent = e.data.settings.imageMaxWidthPercent;
                break;
            case 'remarkSettings':
                this.remarkSettings = e.data.settings;
                this.remarkPlugin = unotesRemarkPlugin(this.remarkSettings);
                break;
            case 'toggleMode':
                if(!this.state.editor.isWysiwygMode()){
                    this.state.editor.changeMode('wysiwyg');
                } else {
                    this.state.editor.changeMode('markdown');
                }
                break;
            case 'imageMaxWidth':
                Temp__img_max_width_percent = e.data.percent;
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
            content: this.state.editor.getMarkdown()
        });
    }

    render() {
        return (
            <div className={".tui-doc-contents " + ((this.state.settings.display2X) ? "display2X" : "display1X")} id="editor" ref={this.el} />
        );
    }
}

export default TuiEditor;
