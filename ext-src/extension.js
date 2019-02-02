// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const path = require('path')
const uNotes = require('./uNotes');


function activate(context){
	new uNotes.UNotes(context);
	vscode.workspace.onDidOpenTextDocument(e => { console.log("HEELO!!!")});
}
exports.activate = activate;



function onDidOpenTextDocument(e){
	vscode.window.showInformationMessage(e);
}

