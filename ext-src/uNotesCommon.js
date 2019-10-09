"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

const path = require("path");
const vscode = require("vscode");
const fs = require("fs");
const fg = require('fast-glob');
const extId = 'unotes';
const mediaFolder = '.media';
const imgPrefix = 'img_';

exports.ExtId = extId;

exports.GlobalState = {
    UnotesVersion: 'Unotes.Version'
}

exports.Utils = {

    context: null,

    stripMD(str) {
        const pos = str.toUpperCase().lastIndexOf('.MD');
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
        const mediaPath = path.join(folderPath, mediaFolder);
        if(!fs.existsSync(mediaPath)){
            return 0;
        }
        const paths = fg.sync([`${mediaPath}/${imgPrefix}*.*`], { deep: 0, onlyFiles: true, nocase: true });
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
        const mediaPath = path.join(folderPath, mediaFolder);

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
        return `${mediaFolder}/${imgName}`;
    } 
} // Utils

class UnotesConfig {
    constructor() {
        if (!vscode.workspace.rootPath) {
            return;
        }

        this.settings = vscode.workspace.getConfiguration(extId);
        this.rootPath = this.settings.get('rootPath', vscode.workspace.rootPath);
        if (!this.rootPath) {
            this.rootPath = vscode.workspace.rootPath;
        }
        this.folderPath = path.join(this.rootPath, './.unotes');

        // setting change events
        this._onDidChange_editor_settings = new vscode.EventEmitter();
        this.onDidChange_editor_settings = this._onDidChange_editor_settings.event;
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

exports.Config = new UnotesConfig();