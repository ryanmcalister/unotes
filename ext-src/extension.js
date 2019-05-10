// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const path = require('path')
const uNotes = require('./uNotes');


function activate(context){
	new uNotes.UNotes(context);
}
exports.activate = activate;


