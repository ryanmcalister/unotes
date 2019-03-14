"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const { Config } = require("./uNotesCommon");

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
      let count = notes.length;
      const seen = new Set();
      for(let i = 0; i < count; ++i){
        seen.add(notes[i].label);
      }
      const toRemove = [];
      for(let key in obj){
        if(obj.hasOwnProperty(key)){
          if(!seen.has(key)){
            toRemove.push(key);
          }
        }
      }
      count = toRemove.length;
      for(let i = 0; i < count; i++){
        delete obj[toRemove[i]];
      }

    } catch(e){
      const msg = e.message();
      console.log(msg);
    }
  }

  syncFiles(notes){
    // sync with files
    let nextIndex = 1000000;
    // sort the notes array
    notes.sort((a, b) => {
      let ai = this.files[a.label];
      if(ai==undefined){
        ai = nextIndex++;
        this.files[a.label] = ai
      }
      let bi = this.files[b.label];
      if(bi==undefined){
        bi = nextIndex++;
        this.files[b.label] = bi;
      }
      return ai - bi;
    });

    // remove notes that don't exist
    this.removeMissing(notes, this.files);

    // reset the files indexes
    const count = notes.length;
    for(let i = 0; i < count; i++){
      this.files[notes[i].label] = i;
    }
  }

  moveUp(key){
    let value = this.files[key];
    if(value){
      value = Math.max(0,--value);
      this.files[key] = value;
      for(let k in this.files){
        if(this.files.hasOwnProperty(k) && k !== key){
          if(this.files[k]==value)
            this.files[k]=value+1;
        }
      }
    }
  }

  moveDown(key){
    let value = this.files[key];
    if(value){
      value = Math.min(Object.keys(this.files).length-1, ++value);
      this.files[key] = value;
      for(let k in this.files){
        if(this.files.hasOwnProperty(k) && k !== key){
          if(this.files[k]==value)
            this.files[k]=value-1;
        }
      }
    }
  }

  getTreeFilePath(){
    return path.join(Config.folderPath, 'unotes_meta.json');
  }

  loadFromObject(obj){
    this.name = obj.name;
    this.files = obj.files;
    for(let key in obj.folders){
      const tree = new UNoteTree();
      tree.loadFromObject(obj.folders[key]);
      this.folders[key] = tree;
    }
  }

  load(){
    try {
      const fp = this.getTreeFilePath();
      if(fs.existsSync(fp)){
        const data = fs.readFileSync(fp, { encoding: 'utf8' });
        const obj = JSON.parse(data);
        this.loadFromObject(obj);
      }
    } catch(e){
      const msg = e.message;
      console.log(msg);
      vscode.window.showWarningMessage("Failed to load Unotes meta information. \nNote ordering may be lost.");
    }
  }

  save(){
    try {
      fs.writeFileSync(this.getTreeFilePath(), JSON.stringify(this, null, 2));
    } catch(e){
      const msg = e.message;
      console.log(msg);
    }
  }
}

exports.UNoteTree = UNoteTree;
