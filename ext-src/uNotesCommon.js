"use strict";

Object.defineProperty(exports, "__esModule", {
    value: true
});

const path = require("path");
const vscode = require("vscode");
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

        // excluded folders
        this.excludedFolders = new Set();
        this.excludedFolders.add("node_modules");

        // setting change events
        this._onDidChange_editor_settings = new vscode.EventEmitter();
        this.onDidChange_editor_settings = this._onDidChange_editor_settings.event;

        // image zoom limit
        this.imageZoomOutLimitPercent = this.settings.editor.imageZoomOutLimitPercent;

        // handlebars helpers
        Handlebars.registerHelper('formatDate', function (dt, dtFormat) {
            return moment(dt).format(dtFormat);
        });

        Handlebars.registerHelper('capitalize', function (str) {
            if (str.length == 0) return str;
            return str.charAt(0).toUpperCase() + str.slice(1);
        });

        Handlebars.registerHelper('capitalizeAll', function (str) {
            if (str.length == 0) return str;
            const words = str.split(" ");
            for(let i = 0; i < words.length; i++) {
                words[i] = words[i][0].toUpperCase() + words[i].slice(1);
            }

            return words.join(" ");
        });


        
    }

    /**
     * Makes sure than the default template file and directory are in place
     */
    async checkDefaultTemplate() {
        
        const default_template = "title_date.hbs"
        const default_data = `# {{capitalizeAll title}}\n\n{{formatDate date "llll"}}\n\n`
        const temp_path = path.join(this.rootPath, '.unotes', templateDir, `${default_template}`);           
           
        try {
            await vscode.workspace.fs.stat(vscode.Uri.file(temp_path));
            return;

        } catch (e) {
            if (e instanceof vscode.FileSystemError && e.code == 'FileNotFound') {
                console.log("Creating default template...");
            } else {
                console.log(`Failed to check template file: ${e.message}`);
                return;
            }
        }

        // create the default template
        try {
            const encoder = new TextEncoder();
            await vscode.workspace.fs.writeFile(vscode.Uri.file(temp_path), encoder.encode(default_data));
        
        } catch (e) {
            console.log(e.message);
        }
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
    async getNextImageIndex(folderPath) {
        let index = 0;
        let mediaPath = path.join(folderPath, Config.mediaFolder);
        if (path.isAbsolute(Config.mediaFolder)) {
            mediaPath = Config.mediaFolder;
        }
        if(!await this.fileExists(mediaPath)){
            return 0;
        }
        const entries = await vscode.workspace.fs.readDirectory(vscode.Uri.file(mediaPath));
        for (const entry of entries) {
            if (entry[1] != vscode.FileType.File || !entry[0].toLowerCase().startsWith(imgPrefix.toLowerCase())){
                continue;
            }
            var re = new RegExp(`.*${imgPrefix}(\\d*)\\..*$`, "g");
            let match = re.exec(entry[0]);
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
    async saveMediaImage(folderPath, imgBuffer, index, imgType) {
        let newIndex = index;
        let mediaPath = path.join(folderPath, Config.mediaFolder);
        if (path.isAbsolute(Config.mediaFolder)) {
            mediaPath = Config.mediaFolder;
        }

        // create the folder if needed
        if(!await this.fileExists(mediaPath)){
            try {
                await vscode.workspace.fs.createDirectory(vscode.Uri.file(mediaPath));
            }
            catch(e) {
                await vscode.window.showWarningMessage("Failed to create media folder.");
                console.log(e.message);
                return;
            }
        }
        if(index === undefined){
            newIndex = await this.getNextImageIndex(folderPath);
        }
        if(imgType===undefined){
            imgType = 'png';
        }
        const imgName = this.getImageName(newIndex, imgType);
        try {
            await vscode.workspace.fs.writeFile(vscode.Uri.file(path.join(mediaPath, imgName)), imgBuffer);
        }
        catch(e){
            await vscode.window.showWarningMessage("Failed to save new media image.");
            console.log(e.message);
            return '';
        }
        return imgName;
    },

    getImageName(index, imgType) {
        return `${imgPrefix}${index}.${imgType}`;
    },
    
    getImageTag(imgName){
        return `![${imgName}](${this.getImageTagUrl(imgName)})`;
    },    
    
    getImageTagUrl(imgName){
        return `${Config.mediaFolder}/${imgName}`;
    },

    /**
     * Get the sorted list of available template names in a workspace
     * @returns string array
     */
    async getTemplateList(){
        const list = []
        const include = new vscode.RelativePattern(Config.rootPath, `.unotes/${templateDir}/*${templateExt}`);
        const results = await vscode.workspace.findFiles(include, null, 100)
           
        results.forEach(r => {
            list.push(path.basename(r.path, templateExt));
        });

        return list.sort();
    },

    /**
     * Get the template data or the default template
     * @param name the name of the template
     * @param data the context data for handlebars
     * @returns the formatted string
     */
    async getTemplate(name, data){
        let temp_name = name;
        if (!temp_name){
            temp_name = Config.settings.get('newNoteTemplate');
        }
        if (!temp_name) return '';
        temp_name = this.stripTemplateExt(temp_name);

        const temp_path = path.join(Config.rootPath, '.unotes', templateDir, `${temp_name}${templateExt}`);
            
        try {
            const d = await vscode.workspace.fs.readFile(vscode.Uri.file(temp_path));
            const decoded = new TextDecoder().decode(d);
            const template = Handlebars.compile(decoded);
            const result = template(data);
            return result;
        
        } catch(e) {
            console.log(e.message);
            await vscode.window.showWarningMessage(e.message);
        }
        return '';
    },

    async fileExists(fpath){
        try {
            await vscode.workspace.fs.stat(vscode.Uri.file(fpath));
            return true;

        } catch (e) {
            if (e instanceof vscode.FileSystemError && e.code == 'FileNotFound') {
                // doesn't exist
            } else {
                console.log(`Failed to check file exists for ${fpath}:\n${e.message}`);
            }
        }
        return false;
    }


} // Utils
