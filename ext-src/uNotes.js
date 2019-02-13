"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

const vscode = require("vscode");
const path = require("path");
const fg = require('fast-glob');
const uNotesPanel = require('./uNotesPanel');

class UNoteProvider {
  constructor(workspaceRoot) {
    this.workspaceRoot = workspaceRoot;
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
  }
  refresh() {
    this._onDidChangeTreeData.fire();
  }
  getTreeItem(element) {
    return element;
  }
  getChildren(element) {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage('No notes in empty workspace');
      return Promise.resolve([]);
    }
    if (element) {
      if(element.isFolder){
        return Promise.resolve(this.getItemsFromFolder(element.folderPath + '/' + element.label));
      }
      return Promise.resolve([]);

    } else {
      return Promise.resolve(this.getItemsFromFolder(''));
    }
  }
  /**
   * Given the path find all notes (.md) files and folders
   */
  getItemsFromFolder(relativePath) {
    // return a Promise that resolves to a list of UNotes
    const toFolder = (item) => {
      return new UNote(path.basename(item), vscode.TreeItemCollapsibleState.Collapsed, true, relativePath);
    }
    const toNote = (item) => {
      return new UNote(path.basename(item), vscode.TreeItemCollapsibleState.None, false, relativePath);
    }
    const folderPath = path.join(this.workspaceRoot, relativePath);
    let folders = fg.sync([`${folderPath}/*`, '!**/node_modules/**'], { deep: 0, onlyDirectories: true }).map(toFolder);
    let notes = fg.sync([`${folderPath}/*.md`], { deep: 0, onlyFiles: true, nocase: true }).map(toNote);
    return folders.concat(notes);
  }
}
exports.UNoteProvider = UNoteProvider;

class UNote extends vscode.TreeItem {
  constructor(label, collapsibleState, isFolder, folderPath) {
    super(label, collapsibleState);
    this.label = label;
    this.collapsibleState = collapsibleState;
    this.isFolder = isFolder;
    this.folderPath = folderPath;
    this.iconPath = {
      light: path.join(__filename, '..', '..', 'resources', 'light', this.isFolder ? 'folder.svg' : 'document.svg'),
      dark: path.join(__filename, '..', '..', 'resources', 'dark', this.isFolder ? 'folder.svg' : 'document.svg')
    };
    this.contextValue = this.isFolder ? 'uNoteFolder' : 'uNoteFile';
  }
  get tooltip() {
    return `${this.label}`;
  }
  get description() {
    return '';
  }
}
exports.UNote = UNote;

class UNotes {
  constructor(context) {
    context.subscriptions.push(vscode.commands.registerCommand('unotes.start', function () {
      uNotesPanel.UNotesPanel.createOrShow(context.extensionPath);
    }));
    
    // Create view and Provider
    const uNoteProvider = new UNoteProvider(vscode.workspace.rootPath);
		const view = vscode.window.createTreeView('noteFiles', { treeDataProvider: uNoteProvider });
		view.onDidChangeSelection((e) => {
			if( e.selection.length > 0 ){
				if(!e.selection[0].isFolder){
          uNotesPanel.UNotesPanel.createOrShow(context.extensionPath);
          const panel = uNotesPanel.UNotesPanel.instance();
          panel.showUNote(e.selection[0]);
				}
			}
    });

    const fswatcher = vscode.workspace.createFileSystemWatcher("**/*.md", false, false, false);
    fswatcher.onDidChange((e) => {
      
      if(uNotesPanel.UNotesPanel.instance()){
        const panel = uNotesPanel.UNotesPanel.instance();
        if(panel.updateFileIfOpen(e.fsPath)){
          uNoteProvider.refresh();
        }

      } else {
        uNoteProvider.refresh();
      }
    });
    fswatcher.onDidCreate((e) => {
      uNoteProvider.refresh();
    });
    fswatcher.onDidDelete((e) => {
      uNoteProvider.refresh();
    });

  }
}
exports.UNotes = UNotes;