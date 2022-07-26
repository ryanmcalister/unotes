"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

const vscode = require("vscode");
const path = require("path");
const { UNotesPanel } = require("./uNotesPanel");
const { UNoteProvider } = require("./uNoteProvider");
const { UNote } = require("./uNote");
const { Config, Utils, ExtId, GlobalState } = require("./uNotesCommon");
const { UNotesMarkdownEditorProvider } = require("./uNotesMarkdownEditor");



const getVersion = function (val) {
    const m = val.match(/^([0-9]*)\.([0-9]*)\..*$/);
    if (!m || m.length < 3) {
        return [0, 0];
    }
    return [parseInt(m[1]), parseInt(m[2])];
}

/**
 * Check to see if a What's New message should pop up
 */
const checkWhatsNew = function (context) {
    const extQualifiedId = `ryanmcalister.${ExtId}`;
    const unotes = vscode.extensions.getExtension(extQualifiedId);
    const unotesVersion = unotes.packageJSON.version;
    const previousVersion = context.globalState.get(GlobalState.UnotesVersion, '');

    const currV = getVersion(unotesVersion);
    const prevV = getVersion(previousVersion);

    const showWhatsNew = currV[0] > prevV[0] || (currV[0] === prevV[0] && currV[1] > prevV[1]);

    if (showWhatsNew) {
        context.globalState.update(GlobalState.UnotesVersion, unotesVersion);
        const actions = [{ title: "What's New" }, { title: "Release Notes" }];
        vscode.window.showInformationMessage(
            `Unotes has been updated to v${unotesVersion} - check out what's new!`,
            ...actions

        ).then(value => {
            if (value == actions[0]) {
                vscode.commands.executeCommand('vscode.open', vscode.Uri.parse("https://github.com/ryanmcalister/unotes/blob/master/README.md#whats-new-in-unotes-12"));

            }
            else if (value === actions[1]) {
                vscode.commands.executeCommand('vscode.open', vscode.Uri.parse("https://github.com/ryanmcalister/unotes/blob/master/CHANGELOG.md#updates"));
            }
        });
    }
}

class UNotes {
    constructor(context) {
        this.disposables = [];
        this.currentNote = null;
        this.selectAfterRefresh = null;

        this.rootPath = vscode.workspace.getConfiguration('unotes').get('rootPath', '');
        if (!this.rootPath && !vscode.workspace.workspaceFolders) {
            vscode.window.showWarningMessage("Please open a folder BEFORE using unotes.");
            return;
        }

        if (!this.rootPath && vscode.workspace.workspaceFolders.length > 1) {
            vscode.window.showWarningMessage("Warning: unotes currently does not support multiple workspaces.");
        }

        Utils.context = context;

        context.subscriptions.push(vscode.commands.registerCommand('unotes.start', async function () {
            await UNotesPanel.createOrShow(context.extensionPath);
        }));

        context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(Config.onChange.bind(Config)));

        // Create view and Provider
        const uNoteProvider = new UNoteProvider(Config.rootPath);
        this.uNoteProvider = uNoteProvider;

        const view = vscode.window.createTreeView('unoteFiles', { treeDataProvider: uNoteProvider });
        this.view = view;

        view.onDidChangeSelection(async (e) => {
            if (e.selection.length > 0) {
                console.log("selection change.");
                this.currentNote = e.selection[0];
                if (!e.selection[0].isFolder) {
                    await UNotesPanel.createOrShow(context.extensionPath);
                    const panel = UNotesPanel.instance();
                    await panel.showUNote(e.selection[0]);
                }
            } else {
                console.log("selection cleared.");
                this.currentNote = null;
            }
        });

        this.disposables.push(
            vscode.commands.registerCommand('unotes.addNote', this.onAddNewNote.bind(this))
        );

        this.disposables.push(
            vscode.commands.registerCommand('unotes.addNoteHere', this.onAddNewNoteHere.bind(this))
        );

        this.disposables.push(
            vscode.commands.registerCommand('unotes.addTemplateNote', this.onAddNewTemplateNote.bind(this))
        );

        this.disposables.push(
            vscode.commands.registerCommand('unotes.addTemplateNoteHere', this.onAddNewTemplateNoteHere.bind(this))
        );

        this.disposables.push(
            vscode.commands.registerCommand('unotes.refreshTree', this.onRefreshTree.bind(this))
        );

        this.disposables.push(
            vscode.commands.registerCommand('unotes.addFolder', this.onAddNewFolder.bind(this))
        );

        this.disposables.push(
            vscode.commands.registerCommand('unotes.addFolderHere', this.onAddNewFolderHere.bind(this))
        );

        this.disposables.push(
            vscode.commands.registerCommand('unotes.renameNote', this.onRenameNote.bind(this))
        )

        this.disposables.push(
            vscode.commands.registerCommand('unotes.deleteNote', this.onDeleteNote.bind(this))
        );

        this.disposables.push(
            vscode.commands.registerCommand('unotes.renameFolder', this.onRenameFolder.bind(this))
        );

        this.disposables.push(
            vscode.commands.registerCommand('unotes.deleteFolder', this.onDeleteFolder.bind(this))
        );

        this.disposables.push(
            vscode.commands.registerCommand('unotes.convertImages', this.onConvertImages.bind(this))
        );

        this.disposables.push(
            vscode.commands.registerCommand('unotes.openWith', this.onOpenWithUnotes.bind(this))
        );

        // this.disposables.push(
        //     vscode.commands.registerCommand('workbench.action.files.save', this.onFileSave.bind(this))
        // );

        // Add panel hotkeys
        // Register commands
        this.disposables.push(vscode.commands.registerCommand("unotes.heading.1", () => {
            const panel = Utils.getActivePanel();
            if(panel){
                panel.hotkeyExec(['Heading', 1]);
            }
        }));
        this.disposables.push(vscode.commands.registerCommand("unotes.heading.2", () => {
            const panel = Utils.getActivePanel();
            if(panel){
                panel.hotkeyExec(['Heading', 2]);
            }
        }));
        this.disposables.push(vscode.commands.registerCommand("unotes.heading.3", () => {
            const panel = Utils.getActivePanel();
            if(panel){
                panel.hotkeyExec(['Heading', 3]);
            }
        }));
        this.disposables.push(vscode.commands.registerCommand("unotes.heading.4", () => {
            const panel = Utils.getActivePanel();
            if(panel){
                panel.hotkeyExec(['Heading', 4]);
            }
        }));
        this.disposables.push(vscode.commands.registerCommand("unotes.heading.5", () => {
            const panel = Utils.getActivePanel();
            if(panel){
                panel.hotkeyExec(['Heading', 5]);
            }
        }));
        this.disposables.push(vscode.commands.registerCommand("unotes.heading.6", () => {
            const panel = Utils.getActivePanel();
            if(panel){
                panel.hotkeyExec(['Heading', 6]);
            }
        }));
        this.disposables.push(vscode.commands.registerCommand("unotes.normal", () => {
            const panel = Utils.getActivePanel();
            if(panel){
                panel.hotkeyExec(['Paragraph']);
            }
        }));
        this.disposables.push(vscode.commands.registerCommand("unotes.bold", () => {
            const panel = Utils.getActivePanel();
            if(panel){
                panel.hotkeyExec(['Bold']);
            }
        }));
        this.disposables.push(vscode.commands.registerCommand("unotes.italic", () => {
            const panel = Utils.getActivePanel();
            if(panel){
                panel.hotkeyExec(['Italic']);
            }
        }));
        this.disposables.push(vscode.commands.registerCommand("unotes.strike", () => {
            const panel = Utils.getActivePanel();
            if(panel){
                panel.hotkeyExec(['Strike']);
            }
        }));
        this.disposables.push(vscode.commands.registerCommand("unotes.task", () => {
            const panel = Utils.getActivePanel();
            if(panel){
                panel.hotkeyExec(['Task']);
            }
        }));
        this.disposables.push(vscode.commands.registerCommand("unotes.ul", () => {
            const panel = Utils.getActivePanel();
            if(panel){
                panel.hotkeyExec(['UL']);
            }
        }));
        this.disposables.push(vscode.commands.registerCommand("unotes.ol", () => {
            const panel = Utils.getActivePanel();
            if(panel){
                panel.hotkeyExec(['OL']);
            }
        }));
        this.disposables.push(vscode.commands.registerCommand("unotes.blockquote", () => {
            const panel = Utils.getActivePanel();
            if(panel){
                panel.hotkeyExec(['Blockquote']);
            }
        }));
        this.disposables.push(vscode.commands.registerCommand("unotes.code", () => {
            const panel = Utils.getActivePanel();
            if(panel){
                panel.hotkeyExec(['Code']);
            }
        }));
        this.disposables.push(vscode.commands.registerCommand("unotes.codeblock", () => {
            const panel = Utils.getActivePanel();
            if(panel){
                panel.hotkeyExec(['CodeBlock']);
            }
        }));
        this.disposables.push(vscode.commands.registerCommand("unotes.indent", () => {
            const panel = Utils.getActivePanel();
            if(panel){
                panel.hotkeyExec(['Indent']);
            }
        }));
        this.disposables.push(vscode.commands.registerCommand("unotes.outdent", () => {
            const panel = Utils.getActivePanel();
            if(panel){
                panel.hotkeyExec(['Outdent']);
            }
        }));
        this.disposables.push(vscode.commands.registerCommand("unotes.hr", () => {
            const panel = Utils.getActivePanel();
            if(panel){
                panel.hotkeyExec(['HR']);
            }
        }));
        this.disposables.push(vscode.commands.registerCommand("unotes.toggleMode", () => {
            const panel = Utils.getActivePanel();
            if(panel){
                panel.toggleEditorMode();
            }
        }));
        this.disposables.push(vscode.commands.registerCommand("unotes.insertTemplate", () => {
            const panel = Utils.getActivePanel();
            if(panel){
                panel.insertTemplate();
            }
        }));

        checkWhatsNew(context);

        // Register editor type
        context.subscriptions.push(UNotesMarkdownEditorProvider.register(context));

    }

    async initialize() {
        await Config.checkDefaultTemplate();

        await this.initUnotesFolder();
        
        if (vscode.workspace.workspaceFolders 
            && vscode.workspace.workspaceFolders[0].uri.scheme == 'file' 
            && Config.rootPath === vscode.workspace.workspaceFolders[0].uri.fsPath) {
            // Can't watch folders outside of workspace
            await this.setupFSWatcher();
        }

        await this.uNoteProvider.initialize();
    }

    async setupFSWatcher() {
        // Setup the File System Watcher for file events
        const fswatcher = vscode.workspace.createFileSystemWatcher(`**/*${Config.noteFileExtension}`, false, false, false);

        fswatcher.onDidChange(async (e) => {
            //console.log("onDidChange");
            if (UNotesPanel.instance()) {
                const panel = UNotesPanel.instance();
                if (panel && await panel.updateFileIfOpen(e.fsPath)) {
                    this.uNoteProvider.refresh();
                }

            } else {
                this.uNoteProvider.refresh();
            }
        }, null, this.disposables);

        fswatcher.onDidCreate((e) => {
            //console.log("onDidCreate");
            this.uNoteProvider.refresh();
        }, null, this.disposables);

        fswatcher.onDidDelete((e) => {
            //console.log("onDidDelete");
            this.uNoteProvider.refresh();
            const panel = UNotesPanel.instance();
            if (panel) {
                panel.closeIfOpen(e.fsPath);
            }
        }, null, this.disposables);
    }

    async initUnotesFolder() {
        try {
            const exists = await Utils.fileExists(Config.folderPath)
            if(exists){
                // get the stats and check if directory
                const stat = await vscode.workspace.fs.stat(vscode.Uri.file(Config.folderPath));
                if (stat.type == vscode.FileType.Directory) {
                    return;
                }
                
                // remove if not a directory
                await vscode.workspace.fs.delete(vscode.Uri.file(Config.folderPath));
            }
            await vscode.workspace.fs.createDirectory(vscode.Uri.file(Config.folderPath));

        } catch (e) {
            await vscode.window.showWarningMessage("Failed to initialize .unotes folder.");
        }
    }

    getSelectedPaths() {
        const paths = [Config.rootPath];
        if (this.view.selection.length > 0) {
            // create in the selected folder
            const item = this.view.selection[0];
            paths.push(item.folderPath);
            if (item.isFolder) {
                // add parent folder name
                paths.push(item.file);
            }
        }
        return paths;
    }

    async onFileSave() {
        
    }

    async onOpenWithUnotes(file) {

        if (file === undefined){
            // so triggered by a keybinding

            // get the browser selection
            // this is a hack (https://github.com/Microsoft/vscode/issues/3553)
            const originalClipboard = await vscode.env.clipboard.readText();
            await vscode.commands.executeCommand('copyFilePath');
            const filepath = await vscode.env.clipboard.readText();  // returns a string
            // preserve the clipboard state
            await vscode.env.clipboard.writeText(originalClipboard);

            if(!await Utils.fileExists(filepath)) return;
            
            // make it a Uri 
            file = await vscode.Uri.file(filepath);
            
        }

        const note = UNote.noteFromPath(file.fsPath);
        await UNotesPanel.createOrShow(Utils.context.extensionPath);
        const panel = UNotesPanel.instance();
        await panel.showUNote(note);

        // open the panel
        // setTimeout(async () => {
        //     try {
        //         await this.view.reveal(note, { expand: 3 });
        //         this.selectAfterRefresh = null;
        //     } catch (e) {
        //         console.log(e.message)
        //     }
        // }, 500);

    }

    async onConvertImages(note) {
        if(!note){
            const panel = UNotesPanel.instance();
            if(panel){
                note = panel.currentNote;
            }
        }
        if(!note){
            await vscode.window.showWarningMessage("Please open a note file before converting images.");
            return;
        }
        // open the file and convert
        const noteFolder = path.join(Config.rootPath, note.folderPath);
        const notePath = path.join(noteFolder, note.file);
        const re = /!\[.*\]\(data:image\/.*;base64,(.*)\)/g;
        let found = 0;
        let imgType = 'png';

        try {
            const decoder = new TextDecoder();
            const content = decoder.decode( await vscode.workspace.fs.readFile(vscode.Uri.file(notePath)));

            // get a unique image index
            let index = await Utils.getNextImageIndex(noteFolder);

            const imgBuffersTypes = [];  // buffer, index, type

            let newContent = content.replace(re, (full_match, img) => {
                let match = /image\/(.*);/g.exec(full_match);
                if (match) {
                    imgType = match[1];
                }
                // write the file
                const fname = Utils.getImageName(index, imgType);
                imgBuffersTypes.push([new Buffer.from(img, 'base64'), index++, imgType]);

                found++;
                // replace the content with the the relative path
                return Utils.getImageTag(fname);
            });

            for (const img of imgBuffersTypes){
                await Utils.saveMediaImage(noteFolder, img[0], img[1], img[2]);
            }

            if (found > 0) {
                // save the new content
                const encoder = new TextEncoder();
                await vscode.workspace.fs.writeFile(vscode.Uri.file(notePath), encoder.encode(newContent));
                if (UNotesPanel.instance()) {
                    const panel = UNotesPanel.instance();
                    if (panel && await panel.updateFileIfOpen(notePath)) {
                        this.uNoteProvider.refresh();
                    }

                } else {
                    this.uNoteProvider.refresh();
                }

                await vscode.window.showInformationMessage(`Converted and saved ${found} image files.`);
            
            } else {
                await vscode.window.showInformationMessage(`No embedded images found.`);
            }
        }
        catch (e) {
            console.log(e);
        }
    }

    async onDeleteNote(note) {
        let result = await vscode.window.showWarningMessage(`Delete '${note.file}'?`, 'Yes', 'No');
        if (result == 'Yes'){
            await vscode.workspace.fs.delete(vscode.Uri.file(path.join(Config.rootPath, note.folderPath, note.file)), { useTrash: true });
            this.uNoteProvider.refresh();
        }
    }

    async onDeleteFolder(folder) {
        let result = await vscode.window.showWarningMessage(`Delete '${folder.file}' and all its contents including non-note files?`, 'Yes', 'No');
        if (result == 'Yes') {
            try {
                await vscode.workspace.fs.delete(vscode.Uri.file(path.join(Config.rootPath, folder.folderPath, folder.file)), { useTrash: true, recursive: true });
            
            } catch(e) {
                await vscode.window.showWarningMessage(e.message);
            }
            this.uNoteProvider.refresh();
        }
    }

    async onRenameNote(note) {
        if(!note){
            const panel = UNotesPanel.instance();
            if(panel){
                note = panel.currentNote;
            }
        }
        if(!note){
            await vscode.window.showWarningMessage("Please open a note file before running command.");
            return;
        } 
        const origName = Utils.stripExt(note.file);  
        let value = await vscode.window.showInputBox({ value: origName });
           
        if(!value) return;
        if(value === origName) return;
        const newFileName = Utils.stripExt(value) + Config.noteFileExtension;

        // make sure there isn't a name collision
        const newFilePath = path.join(Config.rootPath, note.folderPath, newFileName);
        if(await Utils.fileExists(newFilePath)){
            await vscode.window.showWarningMessage(`'${newFileName}' already exists.`);
            return;
        }

        // update the tree value
        if(!this.uNoteProvider.renameNote(note, newFileName)){
            console.log("Failed to rename note in uNoteProvider.");
            return;
        }

        // save the file
        try {
            await vscode.workspace.fs.rename(vscode.Uri.file(note.fullPath()), vscode.Uri.file(newFilePath), { overwrite: false });
        
        } catch (e) {
            await vscode.window.showWarningMessage(e.message);
        }

        // open the new file if the old one is showing
        this.uNoteProvider.refresh();
        const panel = UNotesPanel.instance();
        if (panel){
            await panel.switchIfOpen(note, UNote.noteFromPath(newFilePath));
        }

    }
    
    async onRenameFolder(folder) {
        if(!folder){
            return;
        }
        let value = await vscode.window.showInputBox({ value: folder.file});
            
        if(!value) return;
        if(value === folder.file) return;   // no change

        const newFolderPath = path.join(Config.rootPath, folder.folderPath, value);
        if(await Utils.fileExists(newFolderPath)){
            await vscode.window.showWarningMessage(`'${value}' already exists.`);
            return;
        }

        // update the tree value
        if(!this.uNoteProvider.renameFolder(folder, value)){
            console.log("Failed to rename folder in uNoteProvider.");
            return;
        }

        // rename the folder
        try {
            await vscode.workspace.fs.rename(vscode.Uri.file(folder.fullPath()), vscode.Uri.file(newFolderPath), { overwrite: false });
        
        } catch (e) {
            await vscode.window.showWarningMessage(e.message);
        }

        this.uNoteProvider.refresh();

        const panel = UNotesPanel.instance();
        if (panel){
            panel.checkCurrentFile();
        }
    }

    async addNoteCommon(paths, template) {
        try {
            const note_name = await vscode.window.showInputBox({ placeHolder: 'Enter new note name' });
            if (!note_name) return;

            const title = Utils.stripExt(note_name);
            const newFileName = title + Config.noteFileExtension;
            paths.push(newFileName);
            const newFilePath = path.join(...paths);
            const data = {
                title,
                date: new Date()
            };
            // get the template data
            const template_data = await Utils.getTemplate(template, data);
            
            // create the note file
            if (await this.addNewNote(newFilePath, template_data)) {
                this.selectAfterRefresh = newFilePath;
            }
            this.uNoteProvider.refresh();
            if (this.selectAfterRefresh) {
                const newNote = UNote.noteFromPath(this.selectAfterRefresh);
                setTimeout(() => {
                    try {
                        this.view.reveal(newNote, { expand: 3 });
                        this.selectAfterRefresh = null;
                    } catch (e) {
                        console.log(e.message)
                    }
                }, 500);
            }
            return newFilePath;
        
        } catch(err) {
            console.log(err);
            await vscode.window.showWarningMessage(err.message);
        }
    }

    async addNewNoteHere(item, template) {
        const paths = [Config.rootPath];
        paths.push(item.folderPath);
        if (item.isFolder) {
            // add parent folder name
            paths.push(item.file);
        }
        return await this.addNoteCommon(paths, template);
    }

    async onAddNewNoteHere(item) {
        if (!item) {
            return;
        }
        await this.addNewNoteHere(item, null);
    }

    async onAddNewNote() {
        await this.addNoteCommon(this.getSelectedPaths(), null);
    }

    async selectTemplate() {
        // grab the list of templates
        const templates = await Utils.getTemplateList();
        
        // show a picklist
        return await vscode.window.showQuickPick(
            templates,
            { title: "Unote Templates" }
        );   
    }

    async onAddNewTemplateNoteHere(item) {
        const template = await this.selectTemplate();

        await this.addNewNoteHere(item, template);
    }

    async onAddNewTemplateNote() {
        const template = await this.selectTemplate();

        await this.addNoteCommon(this.getSelectedPaths(), template);
    }

    onRefreshTree() {
        this.uNoteProvider.refresh();
    }

    async addFolderCommon(paths) {
        const value = await vscode.window.showInputBox({ placeHolder: 'Enter new folder name' });
    
        if (!value) return;
        try {
            paths.push(value);    // add folder name        
            const newFolderPath = path.join(...paths);
            if (await this.addNewFolder(newFolderPath)) {
                this.uNoteProvider.refresh();
                const relPath = path.relative(Config.rootPath, newFolderPath);
                const newFolder = UNote.folderFromPath(relPath);
                setTimeout(() => {
                    this.view.reveal(newFolder, { expand: 3 });
                }, 500);
            }
        } catch(e) {
            console.log(e.message);
        }            
    }

    async onAddNewFolderHere(item) {
        if (!item) {
            return;
        }
        const paths = [Config.rootPath];
        paths.push(item.folderPath);
        if (item.isFolder) {
            // add parent folder name
            paths.push(item.file);
        }
        await this.addFolderCommon(paths);
    }

    async onAddNewFolder() {
        await this.addFolderCommon(this.getSelectedPaths());
    }

    async addNewNote(notePath, data) {
        if (!await Utils.fileExists(notePath)) {
            try {
                if (!data) data = '';
                const encoder = new TextEncoder();
                await vscode.workspace.fs.writeFile(vscode.Uri.file(notePath), encoder.encode(data));
                return true;

            } catch (e) {
                await vscode.window.showErrorMessage("Failed to create file.");
                console.log(e);
            }
        } else {
            await vscode.window.showWarningMessage("Note file already exists.");
        }
        return false;
    }

    async addNewFolder(folderPath) {
        if (! await Utils.fileExists(folderPath)) {
            try {
                await vscode.workspace.fs.createDirectory(vscode.Uri.file(folderPath));
                return true;
            } catch (e) {
                await vscode.window.showErrorMessage("Failed to create folder.");
                console.log(e.message);
            }
        } else {
            await vscode.window.showWarningMessage("Folder already exists.");
        }
        return false;
    }

    dispose() {
        fswatcher.dispose();

        while (this.disposables.length) {
            const x = this.disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

}
exports.UNotes = UNotes;