"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

const path = require("path");
const vscode = require("vscode");
const fs = require("fs");
const gl = require('glob');
const Handlebars = require("express-handlebars");
const moment = require("moment")
const extId = 'unotes';
const imgPrefix = 'img_';
const templateExt = '.hbs';
const templateDir = 'templates';

exports.ExtId = extId;

exports.GlobalState = {
    UnotesVersion: 'Unotes.Version'
}

class UnotesConfig {
    constructor() {
        
        this.settings = vscode.workspace.getConfiguration(extId);
        
        // root path setup
        this.rootPath = this.settings.get('rootPath', '');
        if (!this.rootPath) {
            if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length == 0) {
                return;
            }
            this.rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
        }
        this.folderPath = path.join(this.rootPath, './.unotes');

        // note file extension config
        const defaultNoteFileExt = '.md';
        this.noteFileExtension = this.settings.get('noteFileExtension');
        if(!this.noteFileExtension){
            this.noteFileExtension = defaultNoteFileExt;

        } else if(!this.noteFileExtension.startsWith('.')){
            this.noteFileExtension = '.' + this.noteFileExtension;
        } 
        this.noteFileExtension = this.noteFileExtension;

        // media folder
        const defaultMediaFolder = '.media';
        this.mediaFolder = this.settings.get('mediaFolder', defaultMediaFolder);
        if (!this.mediaFolder) {
            this.mediafolder = defaultMediaFolder;
        }

        // setting change events
        this._onDidChange_editor_settings = new vscode.EventEmitter();
        this.onDidChange_editor_settings = this._onDidChange_editor_settings.event;

        // handlebars helpers
        Handlebars.registerHelper('formatDate', function (dtFormat) {
            return moment().format(dtFormat);
        });
        
    }

    onChange(e) {
        if (e.affectsConfiguration(extId)) {
            this.settings = vscode.workspace.getConfiguration(extId);
            // fire events
            const editorPath = extId + '.editor';
            if (e.affectsConfiguration(editorPath)) {
                this._onDidChange_editor_settings.fire();
                if (e.affectsConfiguration(editorPath + '.display2X')) {
                    //console.log(this.settings.get('editor'));
                    //console.log(`display2X==${this.settings.get('editor.display2X')}`);
                }
            }
        }
    }

} // UnotesConfig

var Config = new UnotesConfig();
exports.Config = Config;

exports.Utils = {

    context: null,

    stripExt(str) {
        const pos = str.toUpperCase().lastIndexOf(Config.noteFileExtension.toUpperCase());
        if (pos < 0) {
            return str;
        }
        return str.substring(0, pos);
    },

    stripTemplateExt(str) {
        const pos = str.toUpperCase().lastIndexOf(templateExt.toUpperCase());
        if (pos < 0) {
            return str;
        }
        return str.substring(0, pos);
    },
  
    /**
     * Returns the next image index in the media folder for the document folder
     */
    getNextImageIndex(folderPath) {
        let index = 0;
        const mediaPath = path.join(folderPath, Config.mediaFolder);
        if(!fs.existsSync(mediaPath)){
            return 0;
        }
        const paths = gl.sync(`${imgPrefix}*.*`, { cwd: mediaPath, nodir: true, nocase: true });
        for(let i = 0; i < paths.length; ++i){
            var re = new RegExp(`.*${imgPrefix}(\\d*)\\..*$`, "g");
            let match = re.exec(paths[i]);
            if(match){
                let val = parseInt(match[1]);
                if (index <= val){
                    index = val + 1;
                }
            }
        }
        return index;
    },

    /**
     * Saves an image buffer to a note media directory
     * @param folderPath the folder path of the note
     * @param imgBuffer the image Buffer to be written (base64)
     * @param index optional param for the suffix index number
     * @param imgType optional param for the image type
     */
    saveMediaImage(folderPath, imgBuffer, index, imgType) {
        let newIndex = index;
        const mediaPath = path.join(folderPath, Config.mediaFolder);

        // create the folder if needed
        if(!fs.existsSync(mediaPath)){
            try {
                fs.mkdirSync(mediaPath);
            }
            catch(e) {
                vscode.window.showWarningMessage("Failed to create media folder.");
                return;
            }
        }
        if(index === undefined){
            newIndex = this.getNextImageIndex(folderPath);
        }
        if(imgType===undefined){
            imgType = 'png';
        }
        const imgName = `${imgPrefix}${newIndex}.${imgType}`;
        try {

            fs.writeFileSync(path.join(mediaPath, imgName), imgBuffer, 'base64');
        }
        catch(e){
            vscode.window.showWarningMessage("Failed to save new media image.");
            return '';
        }
        return imgName;
    },
    
    getImageTag(imgName){
        return `![${imgName}](${this.getImageTagUrl(imgName)})`;
    },    
    
    getImageTagUrl(imgName){
        return `${Config.mediaFolder}/${imgName}`;
    },

    /**
     * Get the sorted list of available template names in a workspace
     */
    getTemplateList(){
        if (!vscode.workspace.workspaceFolders || vscode.workspace.workspaceFolders.length == 0) {
            return new Promise();
        }
        const include = new vscode.RelativePattern(Config.rootPath, `.unotes/${templateDir}/*${templateExt}`);
        const p = vscode.workspace.findFiles(include, null, 100)
            .then(results => {
                const list = [];
                results.forEach(r => {
                    list.push(path.basename(r.path, templateExt));
                });
                return list.sort();
            });
        return p;
    },

    /**
     * Get the template data or the default template
     */
    getTemplate(name, data){
        let temp_name = name;
        if (!temp_name){
            temp_name = Config.settings.get('newNoteTemplate');
        }
        const temp_path = path.join(Config.rootPath, '.unotes', templateDir, `${temp_name}${templateExt}`);
        return vscode.workspace.fs.readFile(temp_path)
            .then(d => {
                const template = Handlebars.compile(d);
                const result = template(data);
                return result;
            })
            .catch(err => {
                console.log(err);
                return '';
            });
    }


} // Utils
