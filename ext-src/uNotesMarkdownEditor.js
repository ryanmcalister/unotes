"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CatScratchEditorProvider = void 0;
const vscode = require("vscode");
const { UNotesPanel } = require("./uNotesPanel");
const { Config, Utils, ExtId, GlobalState } = require("./uNotesCommon");

class UNotesMarkdownEditorProvider {
    constructor(context) {
        this.context = context;
        this.unotesPanel = null;
        this.document = null;
    }

    static register(context) {
        const provider = new UNotesMarkdownEditorProvider(context);
        const providerRegistration = vscode.window.registerCustomEditorProvider(UNotesMarkdownEditorProvider.viewType, provider, {
            webviewOptions: {
                retainContextWhenHidden: true,
                enableFindWidget: true
            }
        });
        return providerRegistration;
    }
     /**
     * Called when our custom editor is opened.
     */
    async resolveCustomTextEditor(document, webviewPanel, _token) {
        // Setup the webview
        this.webviewPanel = webviewPanel;
        this.unotesPanel = new UNotesPanel(Utils.context.extensionPath, null);
        this.unotesPanel.initializeWebPanel(webviewPanel);
        this.unotesPanel.attachDocument(document);
        await this.unotesPanel.initialize();
        
    }

}

exports.UNotesMarkdownEditorProvider = UNotesMarkdownEditorProvider;
UNotesMarkdownEditorProvider.viewType = "unotes.markdown";