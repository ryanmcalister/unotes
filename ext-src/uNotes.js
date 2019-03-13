"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const fg = require('fast-glob');
const uNotesPanel = require('./uNotesPanel');
const debounce = require("debounce");

class UNoteTree {

  constructor(name){
    this.name = name;
    this.folders = {};
    this.files = {};
  }

  // recursively find the folder from paths
  getFolder(paths){
    if(paths.length == 0){
      return this;
    }
    const folderName = paths.shift();
    let child = this.folders[folderName];
    if(!child){
      child = new UNoteTree(folderName);
      this.folders[folderName] = child; 
    }
    return child.getFolder(paths);
  }

  syncFolders(folders){
    // remove folders that don't exist
    this.removeMissing(folders, this.folders);
  }

  removeMissing(notes, obj){
    try {
      const count = notes.length;
      const seen = new Set();
      for(let i = 0; i < count; ++i){
        seen.add(notes[i].label);
      }
      const toRemove = [];
      for(const key in obj){
        if(obj.hasOwnProperty(key)){
          if(!seen.has(key)){
            toRemove.push(key);
          }
        }
      }
      for(const key in toRemove){
        delete obj[key];
      }
    } catch(e){
      const msg = e.message;
      console.log(msg);
    }
  }

  syncFiles(notes){
    // sync with files
    let count = Object.keys(this.files).length;
    // sort the notes array
    notes.sort((a, b) => {
      let ai = this.files[a.label];
      if(!ai){
        ai = count++;
        this.files[a.label] = ai
      }
      let bi = this.files[b.label];
      if(!bi){
        bi = count++;
        this.files[b.label] = bi;
      }
      return ai - bi;
    });

    // remove notes that don't exist
    this.removeMissing(notes, this.files);

    // reset the files indexes
    const keys = Object.keys(this.files);
    for(let i = 0; i < count; i++){
      this.files[keys[i]] = i;
    }
  }

  load(){
    
  }

  save(){
    try {
      fs.writeFileSync(path.join(vscode.workspace.rootPath, './.unotes'), JSON.stringify(this, null, 2), 'utf-8');
    } catch(e){
      const msg = e.message;
      console.log(msg);
    }
  }
}

class UNoteProvider {
  constructor(workspaceRoot) {
    this.disposables = [];
    
    this.workspaceRoot = workspaceRoot;
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    this.refresh = debounce(this.refresh.bind(this), 200, true);
    this.saveNoteTree = debounce(this.saveNoteTree.bind(this), 1000);

    this.noteTree = new UNoteTree("");
    this.noteTree.load(); 
        
  }

  dispose() {
		while (this.disposables.length) {
			const x = this.disposables.pop();
			if (x) {
				x.dispose();
			}
	  }
  }

  saveNoteTree(){
    this.noteTree.save();
  }

  refresh() {
    console.log("refreshing...")
    this._onDidChangeTreeData.fire();
  }
  
  getTreeItem(element) {
    return element;
  }
  getParent(element) {
    if(!element)
      return null;
    if(!element.folderPath)
      return null;
    return Promise.resolve(UNoteFolderFromPath(element.folderPath));
  }
  getChildren(element) {
    if (!this.workspaceRoot) {
      vscode.window.showInformationMessage('No notes in empty workspace');
      return Promise.resolve([]);
    }
    if (element) {
      if(element.isFolder){
        return Promise.resolve(this.getItemsFromFolder(element.folderPath + '/' + element.file));
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
    let folders = fg.sync([`${folderPath}/*`, '!**/node_modules/**', '!**/^\.*/**'], { deep: 0, onlyDirectories: true }).map(toFolder);
    let notes = fg.sync([`${folderPath}/*.md`], { deep: 0, onlyFiles: true, nocase: true }).map(toNote);
    // get the relative path in a list
    const paths = path.join(relativePath).split(path.sep);
    paths.shift();  // cut off the root path
    // sync the notes
    const noteFolder = this.noteTree.getFolder(paths);
    noteFolder.syncFolders(folders);
    noteFolder.syncFiles(notes);
    this.saveNoteTree();
    return folders.concat(notes);
  }
}
exports.UNoteProvider = UNoteProvider;

function stripMD(str){
  const pos = str.toUpperCase().lastIndexOf('.MD');
  if(pos<0){
    return str;
  }
  return str.substring(0, pos);
}

class UNote extends vscode.TreeItem {
  constructor(file, collapsibleState, isFolder, folderPath) {
    const label = stripMD(file);
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

function UNoteFileFromPath(filePath){
  const folderPath = path.relative(vscode.workspace.rootPath, path.dirname(filePath));
  const newNote = new UNote(path.basename(filePath), vscode.TreeItemCollapsibleState.None, false, folderPath);
  return newNote;
}

function UNoteFolderFromPath(folderPath){
  let relPath = path.relative(".", path.dirname(folderPath));
  return new UNote(path.basename(folderPath), vscode.TreeItemCollapsibleState.None, true, relPath);
}

/**
 * Helper to remove a directory tree
 * @param {string} dirPath the root dir 
 */
const deleteFolderRecursive = function(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      fs.readdirSync(dirPath).forEach(function(file, index){
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
  catch(e){
    console.log(e);
  }
};

class UNotes {
  constructor(context) {
    this.disposables = [];
    this.currentNote = null;
    this.selectAfterRefresh = null;
    
    context.subscriptions.push(vscode.commands.registerCommand('unotes.start', function () {
      uNotesPanel.UNotesPanel.createOrShow(context.extensionPath);
    }));
    
    // Create view and Provider
    const uNoteProvider = new UNoteProvider(vscode.workspace.rootPath);
    this.uNoteProvider = uNoteProvider;

    const view = vscode.window.createTreeView('unoteFiles', { treeDataProvider: uNoteProvider });
    this.view = view;

		view.onDidChangeSelection((e) => {
			if( e.selection.length > 0 ){
        console.log("selection change.");
        this.currentNote = e.selection[0];
				if(!e.selection[0].isFolder){
          uNotesPanel.UNotesPanel.createOrShow(context.extensionPath);
          const panel = uNotesPanel.UNotesPanel.instance();
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
      vscode.commands.registerCommand('unotes.addFolder', this.onAddNewFolder.bind(this))
    );

    this.disposables.push(
      vscode.commands.registerCommand('unotes.deleteNote', this.onDeleteNote.bind(this))
    );

    this.disposables.push(
      vscode.commands.registerCommand('unotes.deleteFolder', this.onDeleteFolder.bind(this))
    );

    this.disposables.push(
      vscode.commands.registerCommand('unotes.moveUp', this.onMoveUp.bind(this))
    );

    this.disposables.push(
      vscode.commands.registerCommand('unotes.moveDown', this.onMoveDown.bind(this))
    );


    // Setup the File System Watcher for file events
    const fswatcher = vscode.workspace.createFileSystemWatcher("**/*.md", false, false, false);
    fswatcher.onDidChange((e) => {
      console.log("onDidChange");
      if(uNotesPanel.UNotesPanel.instance()){
        const panel = uNotesPanel.UNotesPanel.instance();
        if(panel && panel.updateFileIfOpen(e.fsPath)){
          uNoteProvider.refresh();
        }

      } else {
        uNoteProvider.refresh();
      }
    });
    fswatcher.onDidCreate((e) => {
      console.log("onDidCreate");
      uNoteProvider.refresh();
      if(this.selectAfterRefresh){
        const newNote = UNoteFileFromPath(this.selectAfterRefresh);
        setTimeout(() => {
          this.view.reveal(newNote, { expand: 3 });          
          this.selectAfterRefresh = null;
        }, 500); 
      }
    });
    fswatcher.onDidDelete((e) => {
      console.log("onDidDelete");
      uNoteProvider.refresh();
      const panel = uNotesPanel.UNotesPanel.instance();
      if(panel){
        panel.closeIfOpen(e.fsPath);
      }
    });

  }

  getSelectedPaths(){
    const paths = [vscode.workspace.rootPath];
    if(this.view.selection.length > 0 ){
      // create in the selected folder
      const item = this.view.selection[0];
      paths.push(item.folderPath);        
      if(item.isFolder){
        // add parent folder name
        paths.push(item.file);
      }
    }
    return paths;
  }

  onMoveUp(note){

  }

  onMoveDown(note){

  }

  onDeleteNote(note){
    fs.unlinkSync(path.join(vscode.workspace.rootPath, note.folderPath, note.file));
  }
  
  onDeleteFolder(folder){
    return vscode.window.showWarningMessage(`Delete '${folder.file}' and all its contents?`, 'Yes','No')
    .then(result => {
      if(result == 'Yes'){
        deleteFolderRecursive(path.join(vscode.workspace.rootPath, folder.folderPath, folder.file));
        this.uNoteProvider.refresh();
      }
    });    
  }

  onAddNewNote(){
    vscode.window.showInputBox({ placeHolder: 'Enter new note name' })
    .then(value => {
      if(!value) return;
      const newFileName = stripMD(value) + '.md';
      const paths = this.getSelectedPaths();
      paths.push(newFileName);
      const newFilePath = path.join(...paths);
      if(this.addNewNote(newFilePath)){
        this.selectAfterRefresh = newFilePath;
      }
    })
    .catch(err => {
      console.log(err);
    }); 
  }

  onAddNewFolder(){
    vscode.window.showInputBox({ placeHolder: 'Enter new folder name' })
    .then(value => {
      if(!value) return;
      const paths = this.getSelectedPaths();
      paths.push(value);    // add folder name        
      const newFolderPath = path.join(...paths);
      if(this.addNewFolder(newFolderPath)){
        this.uNoteProvider.refresh();
        const relPath = path.relative(vscode.workspace.rootPath, newFolderPath);
        const newFolder = UNoteFolderFromPath(relPath);
        setTimeout(() => {
          this.view.reveal(newFolder, { expand: 3 });          
        }, 500); 
      }
    })
    .catch(err => {
      console.log(err);
    });
  }
  
  addNewNote(notePath){
    if(!fs.existsSync(notePath)){
      try {
          return fs.openSync(notePath, 'w');
      } catch(e) {
        vscode.window.showErrorMessage("Failed to create file.");
        console.log(e);
      }
    } else {
      vscode.window.showWarningMessage("Note file already exists.");
    }
    return '';
  }

  addNewFolder(folderPath){
    if(!fs.existsSync(folderPath)){
      try {
          fs.mkdirSync(folderPath);
          return true;
      } catch(e) {
        vscode.window.showErrorMessage("Failed to create folder.");
        console.log(e);
      }
    } else {
      vscode.window.showWarningMessage("Folder already exists.");
    }
    return false;
  }

}
exports.UNotes = UNotes;