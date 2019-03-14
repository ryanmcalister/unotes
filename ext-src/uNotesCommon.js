"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

const path = require("path");
const vscode = require("vscode");

exports.Utils = {

  stripMD(str){
    const pos = str.toUpperCase().lastIndexOf('.MD');
    if(pos<0){
      return str;
    }
    return str.substring(0, pos);
  }

}

exports.Config = {
  folderPath: path.join(vscode.workspace.rootPath, './.unotes')
};