"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

const vscode = require("vscode");
const path = require("path");
const { Utils } = require("./uNotesCommon");

class UNote extends vscode.TreeItem {
  constructor(file, collapsibleState, isFolder, folderPath) {
    const label = Utils.stripMD(file);
    super(label, collapsibleState);
    this.file = file;
    this.label = label;
    this.collapsibleState = collapsibleState;
    this.isFolder = isFolder;
    this.folderPath = folderPath;
    this.iconPath = {
      light: path.join(__filename, '..', '..', 'resources', 'light', this.isFolder ? 'folder.svg' : 'document.svg'),
      dark: path.join(__filename, '..', '..', 'resources', 'dark', this.isFolder ? 'folder.svg' : 'document.svg')
    };
    this.contextValue = (this.isFolder ? 'uNoteFolder' : 'uNoteFile')
  }
  addState(state){
    this.contextValue = this.contextValue + ':' + state;
  }
  get tooltip() {
    return `${this.label}`;
  }
  get description() {
    return '';
  }

  static noteFromPath(filePath){
    const folderPath = path.relative(vscode.workspace.rootPath, path.dirname(filePath));
    return new UNote(path.basename(filePath), vscode.TreeItemCollapsibleState.None, false, folderPath);
  }
  
  static folderFromPath(folderPath){
    const relPath = path.relative(".", path.dirname(folderPath));
    return new UNote(path.basename(folderPath), vscode.TreeItemCollapsibleState.None, true, relPath);
  }
}

exports.UNote = UNote;
