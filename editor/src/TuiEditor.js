import React, { Component } from 'react';
import Editor from '@toast-ui/editor/dist/toastui-editor';
import chart from '@toast-ui/editor-plugin-code-syntax-highlight';
import uml from '@toast-ui/editor-plugin-uml';
import codeSyntaxHighlight from '@toast-ui/editor-plugin-code-syntax-highlight';
import hljs from 'highlight.js/lib/highlight'
import '@toast-ui/editor/dist/toastui-editor.css';
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
import gfm from 'remark-gfm';
import frontmatter from 'remark-frontmatter';
import unotesRemarkPlugin from './unotesRemarkPlugin';
import { debounce } from 'debounce';
import katex from 'katex'
import 'katex/dist/katex.min.css'
import './override-katex.css'

// root for local images
var img_root = '';

// zoom out limit percent
var Config__img_zoom_out_limit_percent = null;
var Temp__img_zoom_out_limit_percent = null;

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

function katexPlugin() {
    Editor.codeBlockManager.setReplacer('katex', katexReplacer);
}



class TuiEditor extends Component {

    constructor(props) {
        super(props);
        this.el = React.createRef();
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
            frontMatter: true,
            minHeight: '100vh',
            height: '100vh',
            events: {
                change: debounce(this.onChange.bind(this), 400)
            },
            usageStatistics: false,
            useCommandShortcut: false,
            plugins: [chart, uml, [codeSyntaxHighlight, { hljs }], katexPlugin],
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
            ],
            customHTMLRenderer: {
                // For local images to work
                image(node, context) {
                    const { origin, entering } = context;
                    const result = origin();
                    // console.log("Config__img_zoom_out_limit_percent" + Config__img_zoom_out_limit_percent);
                    // console.log("Temp__img_zoom_out_limit_percent" + Temp__img_zoom_out_limit_percent);
                    let percent = Config__img_zoom_out_limit_percent;
                    if (Temp__img_zoom_out_limit_percent) {
                        percent = Temp__img_zoom_out_limit_percent;
                    }
                    switch (percent) {
                        case 10:
                        case 25:
                        case 50:
                        case 75:
                            result.attributes.class = "zoom" + percent;
                            break;
                        default:
                            result.attributes.class = "zoom100";
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

        editor.on("convertorBeforeHtmlToMarkdownConverted", this.onHtmlBefore);

        editor.on("convertorAfterHtmlToMarkdownConverted", this.onAfterMarkdown)

        editor.on("previewBeforeHook", this.onPreviewBeforeHook);

        editor.on("addImageBlobHook", this.onPaste.bind(this));

        editor.addHook("scroll", this.onScroll.bind(this));

        window.addEventListener('message', this.handleMessage);


        this.setState({ editor });

        window.vscode.postMessage({
            command: 'editorOpened'
        });
    }

    onHtmlBefore(e) {
        let str = replaceAll(e, img_root, '');
        if (str) {
         str = replaceAll(str, 'file://', '');
        }
        return str;
    }

    onAfterMarkdown(e) {
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
    }

    setContent(data){
        img_root = data.folderPath + '/';
        Config__img_zoom_out_limit_percent = data.percent;
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
                Config__img_zoom_out_limit_percent = e.data.settings.imageZoomOutLimitPercent;
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
            case 'imageZoomOut':
                Temp__img_zoom_out_limit_percent = e.data.percent;
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
