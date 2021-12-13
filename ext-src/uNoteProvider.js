"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

const vscode = require("vscode");
const path = require("path");
const debounce = require("debounce");
const { UNoteTree } = require("./uNoteTree");
const { UNote } = require("./uNote");
const { Utils, Config } = require("./uNotesCommon");


class UNoteProvider {
    constructor(workspaceRoot) {
        this.disposables = [];

        this.workspaceRoot = workspaceRoot;
        this._onDidChangeTreeData = new vscode.EventEmitter();
        this.onDidChangeTreeData = this._onDidChangeTreeData.event;
        this.refresh = debounce(this.refresh.bind(this), 200, true);
        this.saveNoteTree = debounce(this.saveNoteTree.bind(this), 1000);

        this.disposables.push(
            vscode.commands.registerCommand('unotes.moveUp', this.onMoveUp.bind(this))
        );

        this.disposables.push(
            vscode.commands.registerCommand('unotes.moveDown', this.onMoveDown.bind(this))
        );

        this.disposables.push(
            vscode.commands.registerCommand('unotes.orderingOff', this.onOrderingOff.bind(this))
        );

        this.disposables.push(
            vscode.commands.registerCommand('unotes.orderingOn', this.onOrderingOn.bind(this))
        );

        this.noteTree = null;

    }

    async initialize() {
        this.noteTree = new UNoteTree("");
        await this.noteTree.load();
        console.log("Tree initialized.");
        this.refresh();
    }

    dispose() {
        while (this.disposables.length) {
            const x = this.disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }

    getPaths(note) {
        // get the relative path in a list
        const paths = path.join(note.folderPath).split(path.sep);
        if (note.isFolder)
            paths.push(note.label);
        paths.shift();  // cut off the root path
        return paths;
    }

    onMoveUp(note) {
        const paths = this.getPaths(note);
        const noteFolder = this.noteTree.getFolder(paths);
        noteFolder.moveUp(note.label);
        this.refresh();
    }

    onMoveDown(note) {
        const paths = this.getPaths(note);
        const noteFolder = this.noteTree.getFolder(paths);
        noteFolder.moveDown(note.label);
        this.refresh();
    }

    onOrderingOff(folder) {
        const paths = this.getPaths(folder);
        const noteFolder = this.noteTree.getFolder(paths);
        noteFolder.isOrdered = false;
        this.refresh();
    }

    onOrderingOn(folder) {
        const paths = this.getPaths(folder);
        const noteFolder = this.noteTree.getFolder(paths);
        noteFolder.isOrdered = true;
        this.refresh();
    }

    renameNote(note, newFileName) {
        const paths = this.getPaths(note);
        const noteFolder = this.noteTree.getFolder(paths);
        return noteFolder.renameNote(note.label, Utils.stripExt(newFileName));
    }

    renameFolder(folder, newFolderName) {
        const paths = this.getPaths(folder);
        if(paths.length < 1){
            return false;
        }
        paths.pop();    // get parent folder
        const noteFolder = this.noteTree.getFolder(paths);
        return noteFolder.renameFolder(folder.file, newFolderName);
    }

    async saveNoteTree() {
        console.log("Saving note tree...");
        await this.noteTree.save();
    }

    refresh() {
        console.log("refreshing...")
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element) {
        return element;
    }

    getParent(element) {
        try {
            if (!element)
                return null;
            if (!element.folderPath)
                return null;
            return Promise.resolve(UNote.folderFromPath(element.folderPath));

        } catch (e) {
            console.log("getParent failed: " + e.message);
        }
    }

    getChildren(element) {
        if (!this.workspaceRoot) {
            vscode.window.showInformationMessage('No notes in empty workspace');
            return Promise.resolve([]);
        }
        if (element) {
            if (element.isFolder) {
                return this.getItemsFromFolder(element.folderPath + '/' + element.file);
            }
            return Promise.resolve([]);

        } else {
            return this.getItemsFromFolder('');
        }
    }
    /**
     * Given the path find all notes (.md) files and folders
     */
    async getItemsFromFolder(relativePath) {
        try {
            if (!this.noteTree){
                return [];
            }
            // return a Promise that resolves to a list of UNotes
            const toFolder = (item) => {
                return new UNote(item, vscode.TreeItemCollapsibleState.Collapsed, true, relativePath);
            }
            const toNote = (item) => {
                return new UNote(item, vscode.TreeItemCollapsibleState.None, false, relativePath);
            }
            const folderPath = path.join(this.workspaceRoot, relativePath);

            const folders = [];
            const notes = [];

            const entries = await vscode.workspace.fs.readDirectory(vscode.Uri.file(folderPath));

            for (const entry of entries) {
                if (entry[1] == vscode.FileType.Directory) { 
                    // filter out excluded folders and hidden folders
                    if (Config.excludedFolders.has(entry[0]) || entry[0][0] == '.') {
                        continue;
                    }
                    folders.push(toFolder(entry[0]));
                }
                else if (entry[1] == vscode.FileType.File) {
                    // choose note files
                    if (entry[0].endsWith(Config.noteFileExtension.toLowerCase()) || entry[0].endsWith(Config.noteFileExtension.toUpperCase())) {
                        notes.push(toNote(entry[0]));
                    }
                }
            }
            
            // get the relative path in a list
            const paths = path.join(relativePath).split(path.sep);
            paths.shift();  // cut off the root path
            // sync the notes
            const noteFolder = this.noteTree.getFolder(paths);
            noteFolder.syncFolders(folders);
            noteFolder.syncFiles(notes);
            this.saveNoteTree();

            return folders.concat(notes);

        } catch (e) {
            console.log("Error building tree: " + e.message);
        }
    }
}

exports.UNoteProvider = UNoteProvider;