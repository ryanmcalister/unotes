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
const { Utils, Config } = require("./uNotesCommon");

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

    this.initUnotesFolder();
    
    context.subscriptions.push(vscode.commands.registerCommand('unotes.start', function () {
      UNotesPanel.createOrShow(context.extensionPath);
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
      vscode.commands.registerCommand('unotes.addFolder', this.onAddNewFolder.bind(this))
    );

    this.disposables.push(
      vscode.commands.registerCommand('unotes.deleteNote', this.onDeleteNote.bind(this))
    );

    this.disposables.push(
      vscode.commands.registerCommand('unotes.deleteFolder', this.onDeleteFolder.bind(this))
    );


    // Setup the File System Watcher for file events
    const fswatcher = vscode.workspace.createFileSystemWatcher("**/*.md", false, false, false);

    fswatcher.onDidChange((e) => {
      console.log("onDidChange");
      if(UNotesPanel.instance()){
        const panel = UNotesPanel.instance();
        if(panel && panel.updateFileIfOpen(e.fsPath)){
          uNoteProvider.refresh();
        }

      } else {
        uNoteProvider.refresh();
      }
    }, null,  this.disposables);

    fswatcher.onDidCreate((e) => {
      console.log("onDidCreate");
      uNoteProvider.refresh();
      if(this.selectAfterRefresh){
        const newNote = UNote.noteFromPath(this.selectAfterRefresh);
        setTimeout(() => {
          try {
            this.view.reveal(newNote, { expand: 3 });          
            this.selectAfterRefresh = null;
          } catch(e){
            console.log(e.message())
          }
        }, 500); 
      }
    }, null,  this.disposables);

    fswatcher.onDidDelete((e) => {
      console.log("onDidDelete");
      uNoteProvider.refresh();
      const panel = UNotesPanel.instance();
      if(panel){
        panel.closeIfOpen(e.fsPath);
      }
    }, null,  this.disposables);

  }

  initUnotesFolder(){    
    try {
      if(fs.existsSync(Config.folderPath) && !fs.lstatSync(Config.folderPath).isDirectory()){
        fs.unlinkSync(Config.folderPath);
      }
      if(!fs.existsSync(Config.folderPath)){
        fs.mkdirSync(Config.folderPath);
      }
    
    } catch(e) {
      vscode.window.showWarningMessage("Failed to create .unotes folder.");
    }
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

  addNoteCommon(paths){
    vscode.window.showInputBox({ placeHolder: 'Enter new note name' })
    .then(value => {
      if(!value) return;
      const newFileName = Utils.stripMD(value) + '.md';
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

  onAddNewNoteHere(item){
    if(!item){
      return;
    }
    const paths = [vscode.workspace.rootPath];
    paths.push(item.folderPath);        
    if(item.isFolder){
      // add parent folder name
      paths.push(item.file);
    }
    this.addNoteCommon(paths);    
  }

  onAddNewNote(){
    this.addNoteCommon(this.getSelectedPaths());
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
  
  addNewNote(notePath){
    if(!fs.existsSync(notePath)){
      try {
          fs.writeFileSync(notePath, '');
          return true;

      } catch(e) {
        vscode.window.showErrorMessage("Failed to create file.");
        console.log(e);
      }
    } else {
      vscode.window.showWarningMessage("Note file already exists.");
    }
    return false;
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