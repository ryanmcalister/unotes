# Extension Component Architecture

This document provides a comprehensive overview of the Unotes VS Code extension backend architecture, detailing how the Node.js components interact with VS Code APIs and manage the note ecosystem.

## Core Architecture

### Entry Point & Activation
- **File**: `ext-src/extension.js`
- **Pattern**: Standard VS Code extension activation
- **Activation Events**: `onView:unoteFiles`, `onCommand:unotes.openWith`

```javascript
function activate(context) {
    const unotes = new uNotes.UNotes(context);
    await unotes.initialize();
}
```

### Main Extension Controller
- **File**: `ext-src/uNotes.js`
- **Class**: `UNotes`
- **Role**: Central orchestrator managing all extension functionality

#### Key Responsibilities:
1. **Command Registration**: Registers all 20+ commands (add note, delete note, move up/down, etc.)
2. **Tree View Management**: Creates and manages the file explorer tree view
3. **Panel Coordination**: Creates and shows the webview panel for editing
4. **Configuration Handling**: Responds to settings changes and workspace folder detection
5. **Status Bar Integration**: Displays image width percentage in status bar

#### Critical Initialization Sequence:
```javascript
constructor(context) {
    // 1. Validate workspace folder exists
    // 2. Set up configuration monitoring
    // 3. Create status bar item
    // 4. Initialize tree view provider
    // 5. Register all command handlers
    // 6. Set up file system watchers
}
```

## Component Deep Dive

### Tree View Provider (`ext-src/uNoteProvider.js`)
**Purpose**: Implements VS Code's `TreeDataProvider` interface for the file explorer sidebar.

#### Architecture Pattern:
- **Data Source**: File system + metadata from `.unotes/unotes_meta.json`
- **Ordering Logic**: Supports both manual ordering and alphabetical sorting per folder
- **State Management**: Uses debounced refresh (200ms) and save operations (1000ms)

#### Key Methods:
```javascript
getChildren(element)     // Returns child folders/notes for tree expansion
getTreeItem(element)     // Converts UNote to VS Code TreeItem
refresh()               // Triggers tree UI update (debounced)
syncFiles(notes)        // Synchronizes file system with ordering metadata
```

#### File Discovery Process:
1. Scan directory using `vscode.workspace.fs.readDirectory()`
2. Filter by note file extension (configurable, default `.md`)
3. Exclude hidden folders (starting with `.`) and `node_modules`
4. Sync with existing ordering metadata
5. Apply manual or alphabetical sorting based on folder settings

### Webview Panel Manager (`ext-src/uNotesPanel.js`)
**Purpose**: Manages the React editor webview, handling content loading and communication.

#### Singleton Pattern:
```javascript
static createOrShow(extensionPath) {
    if (_currentPanel) {
        _currentPanel.panel.reveal(column, false);
    } else {
        _currentPanel = new UNotesPanel(extensionPath, column);
    }
}
```

#### Communication Bridge:
**Extension → Editor Messages**:
- `setContent`: Load note content with metadata
- `settings`: Pass configuration changes
- `remarkSettings`: Update markdown formatting rules
- `toggleMode`: Switch between WYSIWYG and markdown view

**Editor → Extension Messages**:
- `applyChanges`: Save content changes (auto-save with 400ms debounce)
- `editorOpened`: Signal successful initialization
- `imageAdded`: Handle clipboard image paste events

#### Content Management:
```javascript
async showUNote(note) {
    // 1. Read file content from disk
    // 2. Calculate file hash for change detection
    // 3. Send content + metadata to editor
    // 4. Set up auto-save monitoring
}
```

### Hierarchical Ordering System (`ext-src/uNoteTree.js`)
**Purpose**: Manages complex folder/file ordering with persistence.

#### Data Structure:
```javascript
class UNoteTree {
    name: string           // Folder/root name
    isOrdered: boolean     // Manual vs alphabetical ordering
    folders: {}            // Child folder trees
    files: {}             // File ordering indices
}
```

#### Ordering Algorithm:
- **Manual Mode**: Each file gets a numeric index, gaps filled automatically
- **Move Operations**: Swap indices, adjust conflicts
- **Persistence**: Save entire tree structure to `.unotes/unotes_meta.json`

#### Synchronization Process:
1. **File Discovery**: Scan file system for actual files
2. **Metadata Merge**: Combine with existing ordering data
3. **Conflict Resolution**: Assign indices to new files
4. **Cleanup**: Remove metadata for deleted files

### Configuration System (`ext-src/uNotesCommon.js`)
**Purpose**: Centralized configuration management with VS Code settings integration.

#### Configuration Class Pattern:
```javascript
class UnotesConfig {
    constructor() {
        this.settings = vscode.workspace.getConfiguration('unotes');
        this.rootPath = this.resolveRootPath();
        this.setupEventHandlers();
    }
}
```

#### Key Configuration Points:
- **Root Path**: Supports `${workspaceFolder}` variable substitution
- **File Extension**: Configurable note file extension (default `.md`)
- **Media Folder**: Image storage location (relative or absolute paths)
- **Template System**: Handlebars template integration

#### Template System Integration:
- **Location**: `.unotes/templates/*.hbs`
- **Variables**: `title`, `date`
- **Helpers**: `formatDate`, `capitalize`, `capitalizeAll`
- **Auto-creation**: Default template created if missing

## Data Flow Patterns

### File Operations Lifecycle:
1. **User Action**: Tree view context menu or command
2. **Command Handler**: Method in `UNotes` class
3. **File System**: VS Code workspace API calls
4. **Metadata Update**: Tree structure modification
5. **UI Refresh**: Debounced tree view update

### Note Editing Lifecycle:
1. **Selection**: User clicks note in tree view
2. **Panel Creation**: Webview panel created/revealed
3. **Content Loading**: File read, hash calculated
4. **Editor Initialization**: React component receives content
5. **Change Monitoring**: Auto-save on content changes
6. **File Writing**: Debounced save to disk

### Configuration Change Propagation:
1. **VS Code Settings**: User modifies workspace/user settings
2. **Event Handler**: `Config.onChange()` triggered
3. **Component Updates**: Tree view, panel, status bar refresh
4. **Editor Notification**: New settings sent to React component

## Error Handling Strategies

### File System Operations:
- **Pattern**: Try-catch with VS Code error messages
- **Fallback**: Trash API usage with recursive delete option
- **User Feedback**: Specific error messages via `showErrorMessage()`

### Webview Communication:
- **Message Validation**: Check content paths and file hashes
- **State Verification**: Ensure panel exists before operations
- **Recovery**: Panel recreation on communication failures

## Extension Points & Customization

### Command System:
- **Registration**: All commands in `package.json` contributes.commands
- **Grouping**: Context menu groups (unotesAdd, unotesChange, etc.)
- **Conditions**: View item context patterns for enabling/disabling

### Color Theming:
- **Namespace**: `unotes.*` color tokens
- **Categories**: WYSIWYG, markdown, preview modes
- **Integration**: VS Code theme system with fallbacks

### File System Watching:
- **Pattern**: `vscode.workspace.createFileSystemWatcher`
- **Scope**: Note file extension pattern matching
- **Response**: Automatic tree refresh on external changes

## Performance Considerations

### Debouncing Strategy:
- **Tree Refresh**: 200ms debounce prevents excessive UI updates
- **Auto-save**: 400ms debounce in editor, 1000ms for metadata
- **File Watching**: Batched change notifications

### Memory Management:
- **Disposables**: Proper cleanup in `dispose()` methods
- **Event Listeners**: Unregistered on component disposal
- **Webview Lifecycle**: Panel recreation instead of accumulation

### Large Workspace Handling:
- **Lazy Loading**: Tree expansion only loads immediate children
- **File Filtering**: Early exclusion of non-note files
- **Metadata Caching**: In-memory tree structure with periodic saves
