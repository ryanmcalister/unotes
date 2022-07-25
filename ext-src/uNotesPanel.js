"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

const vscode = require('vscode');
const path = require('path');
const { UNote } = require("./uNote");
const { Config, Utils } = require("./uNotesCommon");

let _currentPanel = null;

class UNotesPanel {

    static async createOrShow(extensionPath) {
        const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

        if (_currentPanel) {
            _currentPanel.panel.reveal(column, false);
        } else {
            _currentPanel = new UNotesPanel(extensionPath, column || vscode.ViewColumn.One);
            _currentPanel.createNewWebviewPanel();
            await _currentPanel.initialize();
        }
    }

    static close() {
        try {
            _currentPanel.dispose();
            _currentPanel = null;
        } catch (e) {
            console.log(e);
        }
    }

    static instance() {
        return _currentPanel;
    }


    constructor(extensionPath, column) {
        this.extensionPath = extensionPath;
        this.disposables = [];
        this.document_disposables = [];
        this.reloadContentNeeded = false;
        this.updateSettingsNeeded = false;
        this.currentPath = '';
        this.currentNote = null;
        this.imageToConvert = null;
        this.lastContent = '';
        this.isUnotes = false;
        this.id = Utils.getUniqueId("panel");
        this.document = null;
    }

    getWebviewOptions() {
        let localResourceRoots = [
            vscode.Uri.file(path.join(Config.rootPath)),
            vscode.Uri.file(path.join(this.extensionPath, 'build'))
        ]
        if (Config.mediaFolder.startsWith('/')) {
            localResourceRoots.push(vscode.Uri.file(Config.mediaFolder))
        }
        return {
            enableScripts: true,
            localResourceRoots: localResourceRoots
        };
    }

    getPanelOptions() {
        return {
            retainContextWhenHidden: true,
            enableFindWidget: true
        }
    }

    createNewWebviewPanel() {
        const panel = vscode.window.createWebviewPanel('unotes', "UNotes", 
            { viewColumn: vscode.ViewColumn.column, preserveFocus: false }, 
            { ...this.getPanelOptions(), ...this.getWebviewOptions() });

        this.isUnotes = true;   // this is the singleton panel
        this.initializeWebPanel(panel);

        // add document updates from other editor detection
        vscode.workspace.onDidChangeTextDocument(e => {
            if (e.document.uri.fsPath === this.currentPath) {
                this.updateContents(false, true);
            }
            
        }, null, this.disposables);
    }

    initializeWebPanel(panel) {
        try {
            Utils.panels[this.id] = this;
            this.panel = panel;             // the panel might be from a custom editor
            this.panel.webview.options = this.getWebviewOptions();

            // Set the webview's initial html content
            this.panel.webview.html = this.getWebviewContent();

            // Listen for when the panel is disposed
            // This happens when the user closes the panel or when the panel is closed programatically
            this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

            // Handle messages from the webview
            this.panel.webview.onDidReceiveMessage(async message => {
                switch (message.command) {
                    case 'applyChanges':
                        // kind of a hack to replace pasted images with actual files
                        if (this.imageToConvert){
                            const newContent = await this.convertImage(message.content, this.imageToConvert);
                            if(newContent){     // will be empty on error
                                message.content = newContent;
                            }
                        }
                        await this.saveChanges(message.content);
                        if (this.imageToConvert){
                            this.imageToConvert = null;  
                            await this.updateContents(true, false);
                        }
                        break;
                    case 'editorOpened':
                        await this.updateContents(true, true);
                        this.updateEditorSettings();
                        await this.updateRemarkSettings();
                        break;
                    case 'convertImage':
                        this.imageToConvert = message.data;
                        break;
                    default:
                        console.log("Unknown webview message received:")
                        console.log(message)
                }
            }, null, this.disposables);

            this.panel.onDidChangeViewState(async e => {
                if (e.webviewPanel.active) {
                    if (this.reloadContentNeeded || this.document) {
                        await this.updateContents(true, false);
                        this.reloadContentNeeded = false;
                    }
                    if (this.updateSettingsNeeded) {
                        this.updateEditorSettings();
                        this.updateSettingsNeeded = false;
                    }
                }
            }, null, this.disposables);
            
            this.disposables.push(Config.onDidChange_editor_settings(this.updateEditorSettings.bind(this)));
            this.updateEditorSettings();

        }
        catch (e) {
            console.log(`Failed to initialize Webview: ${e}`);
        }

    }

    attachDocument(document){

        this.dispose_document_disposables();
        this.document = document;

        if(this.document){
            // Hook up event handlers so that we can synchronize the webview with the text document.
    
            // The text document acts as our model, so we have to sync change in the document to our
            // editor and sync changes in the editor back to the document.
            this.currentNote = UNote.noteFromPath(this.document.uri.fsPath);
            this.currentPath = this.document.uri.fsPath;

            vscode.workspace.onDidChangeTextDocument(e => {
                if (e.document.uri.toString() === this.document.uri.toString()) {
                    this.updateContents(false, true);
                }
                
            }, null, this.document_disposables);
        }
    }

    async initialize() {
        await this.updateRemarkSettings();
    }

    updateEditorSettings() {
        if (this.panel.active) {
            this.panel.webview.postMessage({ command: 'settings', settings: Config.settings.get('editor') });

        } else {
            this.updateSettingsNeeded = true;
        }
    }

    async updateRemarkSettings() {
        const remarkSettingsFile = 'remark_settings.json';
        const remarkSettingsCommand = 'remarkSettings';
        const fp = path.join(Config.folderPath, remarkSettingsFile);
        if (await Utils.fileExists(fp)){
            try {
                const decoder = new TextDecoder();
                const data = decoder.decode(await vscode.workspace.fs.readFile(vscode.Uri.file(fp)));
                const obj = JSON.parse(data);
                this.panel.webview.postMessage({ command: remarkSettingsCommand, settings: obj });
                return;
            
            } catch(e){
                const msg = e.message;
                console.log(msg);
                await vscode.window.showWarningMessage("Failed to load remark_settings.json file. \nNo Unotes remark formatting will be done.");
            }
        }
            this.panel.webview.postMessage({ command: remarkSettingsCommand, settings: null });
    }

    hotkeyExec(args) {
        if (this.panel.active) {
            this.panel.webview.postMessage({ command: 'exec', args });
        }
    }

    toggleEditorMode() {
        if (this.panel.active) {
            this.panel.webview.postMessage({ command: 'toggleMode'});
        }
    }

    insertTemplate() {
        // todo
    }

    async saveChanges(content) {
        if (this.writingFile) return;
        if(content == this.lastContent) return;

        // start with the custom editor doc
        let foundDoc = this.document;
        if(!foundDoc){
            for(let doc of vscode.workspace.textDocuments) {
                if(this.currentPath === doc.uri.fsPath){
                    foundDoc = doc;
                    break;
                }
            }
        }
        // we have a document to work with
        if (foundDoc){
            const edit = new vscode.WorkspaceEdit();
            // Just replace the entire document every time for this example extension.
            // Someday compute minimal edits instead.
            this.writingFile = this.currentPath;
            edit.replace(foundDoc.uri, new vscode.Range(0, 0, foundDoc.lineCount, 0), content);
            this.lastContent = content;
            await vscode.workspace.applyEdit(edit);
            this.writingFile = "";

            if (this.isUnotes) {
                // save the update
                await foundDoc.save();
            }

        } else if (this.currentPath) {
            
            this.writingFile = this.currentPath;
            const encoder = new TextEncoder();
            this.lastContent = content;
            await vscode.workspace.fs.writeFile(vscode.Uri.file(this.currentPath), encoder.encode(content));
            this.writingFile = "";
        }
    }

    async showUNote(unote) {
        try {
            const filePath = unote.fullPath();
            this.currentNote = unote;
            this.currentPath = filePath;
            await this.updateContents(false, true);
            const title = unote.label;
            this.panel.title = 'Unotes - ' + title;
        }
        catch (e) {
            console.log(e);
        }
    }

    async updateContents(force, tryFromDoc) {
        try {
            if(this.document){
                const content = this.document.getText();
                if(content == this.lastContent && !force)
                    return;
                const folderPath = this.panel.webview.asWebviewUri(vscode.Uri.file(path.join(Config.rootPath, this.currentNote.folderPath))).path;
                this.lastContent = content
                this.panel.webview.postMessage({ command: 'setContent', content: content, folderPath, contentPath: this.currentPath });

            } else if(this.currentNote){
                // try to find the document
                let foundDoc = null;
                let content = "";
                if(tryFromDoc){
                    for(let doc of vscode.workspace.textDocuments) {
                        if(this.currentPath === doc.uri.fsPath){
                            foundDoc = doc;
                            break;
                        }
                    }
                    if (foundDoc){
                        content = foundDoc.getText();
                    }

                }
                if(!foundDoc){
                    // read from the file
                    const decoder = new TextDecoder();
                    content = decoder.decode(await vscode.workspace.fs.readFile(vscode.Uri.file(this.currentPath)));
                }
               
                if(content == this.lastContent && !force)
                    return;
                const folderPath = this.panel.webview.asWebviewUri(vscode.Uri.file(path.join(Config.rootPath, this.currentNote.folderPath))).path;
                this.lastContent = content
                this.panel.webview.postMessage({ command: 'setContent', content, folderPath, contentPath: this.currentPath });
            }
        }
        catch (e) {
            console.log(e);
        }
    }   

    /**
     * Removes the given image data from the content, 
     * saves an image, puts a relative image path in its place
     * @returns the new content, or blank if a failure happends
     */
    async convertImage(content, image) {
        try {
            if(this.currentNote){
                const noteFolder = path.join(Config.rootPath, this.currentNote.folderPath);
                let found = 0;

                // get a unique image index
                let index = await Utils.getNextImageIndex(noteFolder);
    
                // replace the embedded image with a relative file
                const imgBuffersTypes = [];     // [[buffer, index, type]]

                let newContent = content.replace(image, (d) => {
                    let match = /data:image\/(.*);base64,(.*)$/g.exec(d);

                    if(match){
                        // write the file
                        const fname = Utils.getImageName(index, match[1]);
                        imgBuffersTypes.push([new Buffer.from(match[2], 'base64'), index++, match[1]]);

                        found++;
                        // replace the content with the the relative path
                        return Utils.getImageTagUrl(fname);
                    }
                    return '';  // failed
                });

                for (const img of imgBuffersTypes){
                    await Utils.saveMediaImage(noteFolder, img[0], img[1], img[2]);
                }
                
                if(found > 0){
                    return newContent;
                }
                return content;
            }
        }
        catch(e){
            console.log(e);
        }
        return content;
    }    

    async updateFileIfOpen(filePath) {
        // update our view if an external change happens
        if ((this.currentPath == filePath) && (filePath != this.writingFile)) {
            // if the view is active then load now else flag to reload on showing
            if (this.panel.active) {
                await this.updateContents();
            } else {
                this.reloadContentNeeded = true;
            }
            return true;
        }
        this.writingFile = '';
        return false;
    }

    async switchIfOpen(oldNote, newNote) {
        if (this.currentPath == oldNote.fullPath()) {
            await this.showUNote(newNote);
        }
    }

    closeIfOpen(filePath) {
        if (filePath == this.currentPath) {
            UNotesPanel.close();
        }
    }
    
    async checkCurrentFile(){
        if(!await Utils.fileExists(this.currentPath)) {
            UNotesPanel.close();
        }
    }

    dispose() {
        if(_currentPanel == this) {

            _currentPanel = undefined;
        }
        
        delete Utils.panels[this.id];

        // Clean up our resources
        try {
            this.panel.dispose();

        } catch {
            console.log("Failed to dispose panel.")
        }

        while (this.disposables.length) {
            const x = this.disposables.pop();
            if (x) {
                x.dispose();
            }
        }
        
        this.dispose_document_disposables();
    }

    dispose_document_disposables() {
        while (this.document_disposables.length) {
            const x = this.document_disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    getNonce() {
        let text = "";
        const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    }

    getWebviewContent() {
        const mainScript = '/static/js/main.js';
        const mainStyle = '/static/css/main.css';

        const scriptPathOnDisk = vscode.Uri.file(path.join(this.extensionPath, 'build', mainScript));
        const scriptUri = this.panel.webview.asWebviewUri(scriptPathOnDisk);
        const stylePathOnDisk = vscode.Uri.file(path.join(this.extensionPath, 'build', mainStyle));
        const styleUri = this.panel.webview.asWebviewUri(stylePathOnDisk);
        const baseUri = this.panel.webview.asWebviewUri(vscode.Uri.file(path.join(this.extensionPath, 'build')));

        // Use a nonce to whitelist which scripts can be run
        const nonce = this.getNonce();
        //<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src vscode-resource: https: data:; script-src 'nonce-${nonce}' 'unsafe-inline' 'unsafe-eval' vscode-resource: data:;style-src vscode-resource: 'unsafe-inline' http: https: data:;">

        return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no">
				<meta name="theme-color" content="#000000">
				<title>UNotes</title>
				<link rel="stylesheet" type="text/css" href="${styleUri}">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src vscode-resource: vscode-webview-resource: ${this.panel.webview.cspSoure} http: https: data:; script-src 'unsafe-inline' 'unsafe-eval' vscode-resource: data:; font-src 'self' data:; style-src vscode-resource: 'unsafe-inline' http: https: data:;">
				<base href="${baseUri}/">
			</head>

			<body class="unotes-common">
        <noscript>You need to enable JavaScript to run this app.</noscript>
        <script>
          (function() {
            window.vscode = acquireVsCodeApi();
          }())
        </script>
				<div id="root"></div>
        <script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
    }

}
exports.UNotesPanel = UNotesPanel;
