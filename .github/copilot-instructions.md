# Unotes Extension Development Guide

Unotes is a VS Code extension providing WYSIWYG markdown editing with note management. The architecture separates into two main components: a Node.js extension backend and a React-based editor frontend.

## Architecture Overview

### Dual Build System
- **Extension backend**: `ext-src/` → webpack → `dist/extension.js`
- **Editor frontend**: `editor/src/` → React build → `build/` (served as webview)
- Build commands: `npm run build-all` (both), `npm run build-editor` (React only), `npm run bundle` (extension only)

### Core Components
- **UNotes** (`ext-src/uNotes.js`): Main extension class managing VS Code integration
- **UNotesPanel** (`ext-src/uNotesPanel.js`): Webview container for the React editor
- **UNoteProvider** (`ext-src/uNoteProvider.js`): Tree view data provider for file navigation
- **TuiEditor** (`editor/src/TuiEditor.js`): React component wrapping @toast-ui/editor

### File Organization System
- Notes stored as `.md` files (configurable via `unotes.noteFileExtension`)
- Metadata in `.unotes/unotes_meta.json` preserves note ordering and folder states
- Templates in `.unotes/templates/*.hbs` using Handlebars syntax
- Images in `.media/` folder (configurable via `unotes.mediaFolder`)

## Development Workflows

### Building and Testing
```powershell
# Full rebuild (required after backend changes)
npm run build-all

# Editor-only rebuild (after React changes)
npm run build-editor

# Package extension
npm run pack
```

### Configuration Patterns
- Settings namespace: `unotes.*` (see `package.json` contributes.configuration)
- Color customization via `workbench.colorCustomizations` with `unotes.*` prefixes
- Root path supports `${workspaceFolder}` variable substitution

### File Management Architecture
- **UNoteTree** (`ext-src/uNoteTree.js`): Hierarchical note ordering system
- Manual vs alphabetical ordering per folder (`isOrdered` property)
- File operations use VS Code workspace APIs with trash support
- File watching via `vscode.workspace.createFileSystemWatcher`

## Critical Integration Points

### Editor-Extension Communication
Communication via `postMessage` between React editor and VS Code extension:

```javascript
// Extension → Editor
panel.webview.postMessage({ command: 'setContent', content, folderPath, percent });

// Editor → Extension  
window.vscode.postMessage({ command: 'contentChanged', content, fileHash });
```

Key message types: `setContent`, `contentChanged`, `exec`, `settings`, `remarkSettings`, `toggleMode`

### Image Handling
- Clipboard images embedded as base64, optionally converted to files
- Image path resolution for local images requires `img_root` context
- Conversion via `Utils.saveMediaImage()` and regex replacement patterns

### Template System
- Handlebars templates with helpers: `formatDate`, `capitalize`, `capitalizeAll`
- Template variables: `title`, `date`
- Default template auto-creation in `Config.checkDefaultTemplate()`

## Project-Specific Patterns

### Note File Lifecycle
1. Create via `addNewNote()` → write file → refresh tree provider
2. Edit via webview panel → auto-save on change (debounced 400ms)
3. Move/rename via tree provider → update metadata → file system operation

### Error Handling
- Extension uses VS Code's `showErrorMessage`/`showWarningMessage`
- React editor catches TUI editor exceptions to prevent data loss
- File operations wrapped in try-catch with trash fallback

### Theme Integration
- Dynamic theme detection: `document.documentElement.getElementsByClassName("vscode-dark")`
- Custom CSS overrides in `override-editor.css` and `override-editor-dark.css`
- Color variables mapped to VS Code theme tokens

## Common Development Tasks

### Adding New Commands
1. Register in `package.json` contributes.commands and menus
2. Implement handler in `uNotes.js` constructor
3. Add to context subscriptions for proper cleanup

### Modifying Editor Behavior
- Editor configuration in `TuiEditor.componentDidMount()`
- Custom renderers for markdown elements in `customHTMLRenderer`
- Plugin integration follows @toast-ui/editor patterns

### File Tree Operations
- Tree state management in `UNoteTree.syncFiles()`/`syncFolders()`
- Ordering operations modify indices, then call `refresh()`
- Always save metadata after structural changes

Remember: Extension auto-saves all changes, markdown will be reformatted, and version control is strongly recommended for data safety.

