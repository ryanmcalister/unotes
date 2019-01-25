// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require('vscode');
const path = require('path');


function activate(context) {

    context.subscriptions.push(vscode.commands.registerCommand('unotes.start', function () {
        UnotesPanel.createOrShow(context.extensionPath);
		}));
		
		

}
exports.activate = activate;

let _currentPanel = null;

class UnotesPanel {

  static createOrShow(extensionPath){
    const column = vscode.window.activeTextEditor ? vscode.window.activeTextEditor.viewColumn : undefined;

    if(_currentPanel){
      _currentPanel.panel.reveal(column);
    } else {
      _currentPanel = new UnotesPanel(extensionPath, column || vscode.ViewColumn.One);
    }
  }

  constructor(extensionPath, column){
    this.extensionPath = extensionPath;
    this.disposables = [];
    
    this.panel = vscode.window.createWebviewPanel('unotes', "UNotes", column, {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.file(path.join(this.extensionPath, 'build'))
      ]
    });

    // Set the webview's initial html content
    this.panel.webview.html = this.getWebviewContent();

    // Listen for when the panel is disposed
		// This happens when the user closes the panel or when the panel is closed programatically
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);

    // Handle messages from the webview
		this.panel.webview.onDidReceiveMessage(message => {
			switch (message.command) {
				case 'alert':
					vscode.window.showErrorMessage(message.text);
					return;
			}
		}, null, this.disposables);

  }

  doRefactor() {
		// Send a message to the webview
		// You can send any JSON serializable data.
		this.panel.webview.postMessage({ command: 'refactor' });
  }
  
  dispose() {
		_currentPanel = undefined;

		// Clean up our resources
		this.panel.dispose();

		while (this.disposables.length) {
			const x = this.disposables.pop();
			if (x) {
				x.dispose();
			}
	  }
  }

  getWebviewContent() {
    const vsScheme = { scheme: 'vscode-resource' };
		const manifest = require(path.join(this.extensionPath, 'build', 'asset-manifest.json'));
		const mainScript = manifest['main.js'];
		const mainStyle = manifest['main.css'];
    
		const scriptPathOnDisk = vscode.Uri.file(path.join(this.extensionPath, 'build', mainScript));
		const scriptUri = scriptPathOnDisk.with(vsScheme);
		const stylePathOnDisk = vscode.Uri.file(path.join(this.extensionPath, 'build', mainStyle));
    const styleUri = stylePathOnDisk.with(vsScheme);
    const baseUri = vscode.Uri.file(path.join(this.extensionPath, 'build')).with(vsScheme);
    
		// Use a nonce to whitelist which scripts can be run
    const nonce = getNonce();
    //<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src vscode-resource: https: data:; script-src 'nonce-${nonce}' 'unsafe-inline' 'unsafe-eval' vscode-resource: data:;style-src vscode-resource: 'unsafe-inline' http: https: data:;">
				
		return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no">
				<meta name="theme-color" content="#000000">
				<title>UNotes</title>
				<link rel="stylesheet" type="text/css" href="${styleUri}">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src vscode-resource: http: https: data:; script-src 'unsafe-inline' 'unsafe-eval' vscode-resource: data:;style-src vscode-resource: 'unsafe-inline' http: https: data:;">
				<base href="${baseUri}/">
			</head>

			<body>
				<noscript>You need to enable JavaScript to run this app.</noscript>
				<div id="root"></div>
				<script nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
	}

}

function getNonce() {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}