"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const { UNotesPanel } = require("./uNotesPanel");
const { UNoteProvider } = require("./uNoteProvider");
const { UNote } = require("./uNote");
const { Utils, Config, ExtId, GlobalState } = require("./uNotesCommon");

/**
 * Helper to remove a directory tree
 * @param {string} dirPath the root dir 
 */
const deleteFolderRecursive = function (dirPath) {
    try {
        if (fs.existsSync(dirPath)) {
            fs.readdirSync(dirPath).forEach(function (file, index) {
                const curPath = path.join(dirPath, file);
                if (fs.lstatSync(curPath).isDirectory()) { // recurse
                    deleteFolderRecursive(curPath);
                } else { // delete file
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(dirPath);
        }
    }
    catch (e) {
        console.log(e);
    }
};

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
                vscode.commands.executeCommand('vscode.open', vscode.Uri.parse("https://github.com/ryanmcalister/unotes/blob/master/README.md#whats-new-in-unotes-11"));

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

        if (!vscode.workspace.rootPath) {
            vscode.window.showWarningMessage("Please open a folder BEFORE using unotes.");
            return;
        }

        if (vscode.workspace.workspaceFolders.length > 1) {
            vscode.window.showWarningMessage("Warning: unotes currently does not support multiple workspaces.");
        }

        Utils.context = context;

        this.initUnotesFolder();

        context.subscriptions.push(vscode.commands.registerCommand('unotes.start', function () {
            UNotesPanel.createOrShow(context.extensionPath);
        }));

        context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(Config.onChange.bind(Config)));

        // Create view and Provider
        const uNoteProvider = new UNoteProvider(Config.rootPath);
        this.uNoteProvider = uNoteProvider;

        const view = vscode.window.createTreeView('unoteFiles', { treeDataProvider: uNoteProvider });
        this.view = view;

        view.onDidChangeSelection((e) => {
            if (e.selection.length > 0) {
                console.log("selection change.");
                this.currentNote = e.selection[0];
                if (!e.selection[0].isFolder) {
                    UNotesPanel.createOrShow(context.extensionPath);
                    const panel = UNotesPanel.instance();
                    panel.showUNote(e.selection[0]);
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
            vscode.commands.registerCommand('unotes.deleteFolder', this.onDeleteFolder.bind(this))
        );

        this.disposables.push(
            vscode.commands.registerCommand('unotes.convertImages', this.onConvertImages.bind(this))
        );

        if (Config.rootPath === vscode.workspace.rootPath) {
            // Can't watch folders outside of workspace
            this.setupFSWatcher();
        }

        checkWhatsNew(context);

    }

    setupFSWatcher() {
        // Setup the File System Watcher for file events
        const fswatcher = vscode.workspace.createFileSystemWatcher("**/*.md", false, false, false);

        fswatcher.onDidChange((e) => {
            //console.log("onDidChange");
            if (UNotesPanel.instance()) {
                const panel = UNotesPanel.instance();
                if (panel && panel.updateFileIfOpen(e.fsPath)) {
                    uNoteProvider.refresh();
                }

            } else {
                uNoteProvider.refresh();
            }
        }, null, this.disposables);

        fswatcher.onDidCreate((e) => {
            //console.log("onDidCreate");
            uNoteProvider.refresh();
        }, null, this.disposables);

        fswatcher.onDidDelete((e) => {
            //console.log("onDidDelete");
            uNoteProvider.refresh();
            const panel = UNotesPanel.instance();
            if (panel) {
                panel.closeIfOpen(e.fsPath);
            }
        }, null, this.disposables);
    }

    initUnotesFolder() {
        try {
            if (fs.existsSync(Config.folderPath) && !fs.lstatSync(Config.folderPath).isDirectory()) {
                fs.unlinkSync(Config.folderPath);
            }
            if (!fs.existsSync(Config.folderPath)) {
                fs.mkdirSync(Config.folderPath);
            }

        } catch (e) {
            vscode.window.showWarningMessage("Failed to create .unotes folder.");
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

    onConvertImages(note) {
        if(!note){
            const panel = UNotesPanel.instance();
            if(panel){
                note = panel.currentNote;
            }
        }
        if(!note){
            vscode.window.showWarningMessage("Please open a note file before converting images.");
            return;
        }
        // open the file and convert
        const noteFolder = path.join(Config.rootPath, note.folderPath);
        const notePath = path.join(noteFolder, note.file);
        const re = /!\[.*\]\(data:image\/.*;base64,(.*)\)/g;
        let found = 0;
        let imgType = 'png';

        try {

            const content = fs.readFileSync(notePath, 'utf8');

            // get a unique image index
            let index = Utils.getNextImageIndex(noteFolder);

            let newContent = content.replace(re, (full_match, img) => {
                let match = /image\/(.*);/g.exec(full_match);
                if (match) {
                    imgType = match[1];
                }
                // write the file
                const fname = Utils.saveMediaImage(noteFolder, new Buffer(img, 'base64'), index++, imgType);

                found++;
                // replace the content with the the relative path
                return Utils.getImageTag(fname);
            });

            if (found > 0) {
                // save the new content
                fs.writeFileSync(notePath, newContent, 'utf8');
                if (UNotesPanel.instance()) {
                    const panel = UNotesPanel.instance();
                    if (panel && panel.updateFileIfOpen(notePath)) {
                        this.uNoteProvider.refresh();
                    }

                } else {
                    this.uNoteProvider.refresh();
                }
            }
        }
        catch (e) {
            console.log(e);
        }
    }

    onDeleteNote(note) {
        return vscode.window.showWarningMessage(`Delete '${note.file}'?`, 'Yes', 'No')
            .then(result => {
                if (result == 'Yes') {
                    fs.unlinkSync(path.join(Config.rootPath, note.folderPath, note.file));
                    this.uNoteProvider.refresh();
                }
            });
    }

    onDeleteFolder(folder) {
        return vscode.window.showWarningMessage(`Delete '${folder.file}' and all its contents?`, 'Yes', 'No')
            .then(result => {
                if (result == 'Yes') {
                    deleteFolderRecursive(path.join(Config.rootPath, folder.folderPath, folder.file));
                    this.uNoteProvider.refresh();
                }
            });
    }

    onRenameNote(note) {
        if(!note){
            const panel = UNotesPanel.instance();
            if(panel){
                note = panel.currentNote;
            }
        }
        if(!note){
            vscode.window.showWarningMessage("Please open a note file before running command.");
            return;
        } 
        const origName = Utils.stripMD(note.file);  
        vscode.window.showInputBox({ value: origName })
            .then(value => {
                if(!value) return;
                if(value === origName) return;
                const newFileName = Utils.stripMD(value) + '.md';

                // make sure there isn't a name collision
                const newFilePath = path.join(Config.rootPath, note.folderPath, newFileName);
                if(fs.existsSync(newFilePath)){
                    vscode.window.showWarningMessage(`'${newFileName}' already exists.`);
                }

                // update the tree value
                if(!this.uNoteProvider.renameNote(note, newFileName)){
                    console.log("Failed to rename note in uNoteProvider.");
                    return;
                }

                // save the file
                fs.renameSync(note.filePath(), newFilePath);

                // open the new file if the old one is showing
                this.uNoteProvider.refresh();
                const panel = UNotesPanel.instance();
                if (panel){
                    panel.switchIfOpen(note, UNote.noteFromPath(newFilePath));
                }
            });
    }

    addNoteCommon(paths) {
        vscode.window.showInputBox({ placeHolder: 'Enter new note name' })
            .then(value => {
                if (!value) return;
                const newFileName = Utils.stripMD(value) + '.md';
                paths.push(newFileName);
                const newFilePath = path.join(...paths);
                if (this.addNewNote(newFilePath)) {
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
            })
            .catch(err => {
                console.log(err);
            });
    }

    onAddNewNoteHere(item) {
        if (!item) {
            return;
        }
        const paths = [Config.rootPath];
        paths.push(item.folderPath);
        if (item.isFolder) {
            // add parent folder name
            paths.push(item.file);
        }
        this.addNoteCommon(paths);
    }

    onAddNewNote() {
        this.addNoteCommon(this.getSelectedPaths());
    }

    onRefreshTree() {
        this.uNoteProvider.refresh();
    }

    addFolderCommon(paths) {
        vscode.window.showInputBox({ placeHolder: 'Enter new folder name' })
            .then(value => {
                if (!value) return;

                paths.push(value);    // add folder name        
                const newFolderPath = path.join(...paths);
                if (this.addNewFolder(newFolderPath)) {
                    this.uNoteProvider.refresh();
                    const relPath = path.relative(Config.rootPath, newFolderPath);
                    const newFolder = UNote.folderFromPath(relPath);
                    setTimeout(() => {
                        this.view.reveal(newFolder, { expand: 3 });
                    }, 500);
                }
            })
            .catch(err => {
                console.log(err);
            });
    }

    onAddNewFolderHere(item) {
        if (!item) {
            return;
        }
        const paths = [Config.rootPath];
        paths.push(item.folderPath);
        if (item.isFolder) {
            // add parent folder name
            paths.push(item.file);
        }
        this.addFolderCommon(paths);
    }

    onAddNewFolder() {
        this.addFolderCommon(this.getSelectedPaths());
    }

    addNewNote(notePath) {
        if (!fs.existsSync(notePath)) {
            try {
                fs.writeFileSync(notePath, '');
                return true;

            } catch (e) {
                vscode.window.showErrorMessage("Failed to create file.");
                console.log(e);
            }
        } else {
            vscode.window.showWarningMessage("Note file already exists.");
        }
        return false;
    }

    addNewFolder(folderPath) {
        if (!fs.existsSync(folderPath)) {
            try {
                fs.mkdirSync(folderPath);
                return true;
            } catch (e) {
                vscode.window.showErrorMessage("Failed to create folder.");
                console.log(e);
            }
        } else {
            vscode.window.showWarningMessage("Folder already exists.");
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