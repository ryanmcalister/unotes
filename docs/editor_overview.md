# Editor Component Architecture

This document provides a comprehensive overview of the Unotes React-based editor component, detailing the integration with @toast-ui/editor, VS Code webview communication, and markdown processing pipeline.

## Core Architecture

### React Application Structure
- **Entry Point**: `editor/src/index.js`
- **Main Component**: `TuiEditor.js` - React wrapper around @toast-ui/editor
- **Error Handling**: `ErrorBoundary.js` - Catches and reports React errors to extension
- **Build Process**: Custom React build script (`build-non-split.js`) that consolidates chunks

```javascript
ReactDOM.render(
  <ErrorBoundary><TuiEditor /></ErrorBoundary>, 
  document.getElementById('root')
);
```

### Build System Architecture
**Unique Approach**: Modified React build to prevent code splitting
- **Problem**: VS Code webviews struggle with multiple JS/CSS files
- **Solution**: Custom build script consolidates all chunks into single files
- **Output**: `build/static/js/main.js` and `build/static/css/main.css`

```javascript
// build-non-split.js modifications:
config.optimization.splitChunks = { cacheGroups: { default: false } };
config.optimization.runtimeChunk = false;
config.output.filename = 'static/js/main.js';
```

## TuiEditor Component Deep Dive

### Core Dependencies Integration
```javascript
import Editor from '@toast-ui/editor';
import chart from '@toast-ui/editor-plugin-chart';
import uml from '@toast-ui/editor-plugin-uml';
import codeSyntaxHighlight from '@toast-ui/editor-plugin-code-syntax-highlight/dist/toastui-editor-plugin-code-syntax-highlight-all.js';
import katex from 'katex';
```

### State Management Pattern
```javascript
state = {
    editor: null,           // @toast-ui/editor instance
    settings: {             // Extension settings
        display2X: false,
        imageMaxWidthPercent: 100,
        extraFocus: false
    }
}
```

### Editor Initialization Sequence
1. **Theme Detection**: Checks DOM for `vscode-dark` class
2. **Plugin Configuration**: Sets up chart, UML, syntax highlighting, KaTeX
3. **Toolbar Customization**: Configures toolbar items and custom buttons
4. **Event Registration**: Sets up change handlers, paste handlers, caret tracking
5. **Communication Setup**: Establishes message listeners with extension

```javascript
componentDidMount() {
    let theme = 'light';
    if (document.documentElement.getElementsByClassName("vscode-dark").length > 0) {
        theme = 'dark';
    }
    
    let editor = new Editor({
        el: this.el.current,
        initialEditType: 'wysiwyg',
        previewStyle: 'vertical',
        frontMatter: true,
        theme: theme,
        plugins: [chart, uml, katexPlugin, codeSyntaxHighlight],
        // ... additional configuration
    });
}
```

## Communication Architecture

### Message Passing Protocol
**Pattern**: Bidirectional postMessage communication between webview and extension

#### Extension → Editor Messages:
```javascript
handleMessage(e) {
    switch (e.data.command) {
        case 'setContent':      // Load new note content
        case 'settings':        // Update configuration
        case 'remarkSettings':  // Markdown formatting rules
        case 'toggleMode':      // Switch WYSIWYG/markdown
        case 'imageMaxWidth':   // Adjust image display
        case 'focus':          // Focus editor
    }
}
```

#### Editor → Extension Messages:
```javascript
window.vscode.postMessage({
    command: 'contentChanged',
    content: newContent,
    fileHash: currentFileHash
});
```

### Auto-Save Architecture
**Pattern**: Debounced content synchronization with change detection

```javascript
onChange() {
    if (!this.contentSet) return; // Prevent save during initial load
    
    const content = this.state.editor.getMarkdown();
    window.vscode.postMessage({
        command: 'contentChanged',
        content: content,
        fileHash: this.fileHash
    });
}
```

**Debouncing**: 400ms delay prevents excessive save operations during typing

## Advanced Features Implementation

### KaTeX Math Rendering
**Custom Plugin Architecture**: Implements @toast-ui/editor plugin interface

```javascript
function katexPlugin(context, options) {
    return {
        toHTMLRenderers: getHTMLRenderers(context)
    }
}

function katexReplacer(code) {
    const katex_options = { throwOnError: false };
    return katex.renderToString(code, katex_options);
}
```

**Usage Pattern**: `$$katex \sqrt{x^2+1} $$` blocks converted to rendered math

### Image Handling System
**Multi-Modal Approach**: Supports local files, embedded base64, and URL images

#### Local Image Resolution:
```javascript
customHTMLRenderer: {
    image(node, context) {
        const imgSrc = node.destination;
        if (!imgSrc.startsWith('http') && !imgSrc.startsWith('data:')) {
            // Resolve relative paths using img_root context
            node.destination = img_root + imgSrc;
        }
        return context.origin(); // Use default renderer with modified path
    }
}
```

#### Image Width Management:
- **Global Setting**: `Config__img_max_width_percent` from extension settings
- **Temporary Override**: `Temp__img_max_width_percent` for per-image adjustments
- **CSS Integration**: Dynamic max-width application

### Paste Event Handling
**Clipboard Integration**: Supports image paste with automatic processing

```javascript
editor.on("addImageBlobHook", this.onPaste.bind(this));

onPaste(blob, callback) {
    if (this.state.settings.convertPastedImages) {
        // Signal extension to convert to file
        this.imageToConvert = { blob, callback };
    } else {
        // Embed as base64
        const reader = new FileReader();
        reader.onload = () => callback(reader.result, 'image');
        reader.readAsDataURL(blob);
    }
}
```

## Content Processing Pipeline

### Markdown Reformatting System
**Optional Feature**: Experimental remark-based markdown standardization

```javascript
onBeforeConvertWysiwygToMarkdown(markdownContent) {
    if (this.remarkSettings) {
        let processor = remark().use({ settings: this.remarkSettings });
        
        if (this.remarkSettings.gfm) {
            processor = processor.use(gfm, this.remarkSettings);
        }
        
        return processor
            .use(frontmatter, ['yaml', 'toml'])
            .processSync(markdownContent).contents;
    }
    return markdownContent;
}
```

**Configuration**: Via `.unotes/remark_settings.json` with full remark-stringify options

### Custom Remark Plugin
**File**: `unotesRemarkPlugin.js`
**Purpose**: Enhanced markdown formatting with Unotes-specific rules

#### Additional Options:
- `listItemSpace`: Spaces after list markers (when `listItemIndent = 'tab'`)
- `listItemTabSize`: Custom tab size for list indentation (default: 4)

## Styling Architecture

### CSS Override System
**Layer Pattern**: Base styles + theme-specific overrides + custom overrides

```javascript
import '@toast-ui/editor/dist/toastui-editor.css';
import '@toast-ui/editor/dist/theme/toastui-editor-dark.css';
import './override-editor.css';
import './override-editor-dark.css';
import './override-katex.css';
```

#### Theme Integration:
- **VS Code Variables**: CSS custom properties map to VS Code theme tokens
- **Dynamic Classes**: `display2X`/`display1X` for toolbar scaling
- **Color Inheritance**: `var(--vscode-unotes-*)` pattern for theme colors

### Responsive Design:
```css
.tui-doc-contents.display2X .toastui-editor-toolbar-icons {
    /* 2x toolbar scaling for accessibility */
}
```

## Error Handling & Recovery

### React Error Boundary
**Purpose**: Prevents complete application crashes from editor errors

```javascript
componentDidCatch(error, info) {
    this.setState({ hasError: true });
    window.vscode.postMessage({
        command: 'console',
        content: `ERROR: ${error}`
    });
}
```

### Content Integrity Protection
**Safety Mechanism**: Prevents save operations during problematic states

```javascript
setContent(data, fileHash, savedHash) {
    try {
        this.state.editor.setMarkdown(data.content, false);
        this.contentSet = true; // Enable saving
    } catch(error) {
        this.contentSet = false; // Disable saving for safety
        console.log(error);
    }
}
```

## Performance Optimizations

### Debounced Operations:
- **Content Changes**: 400ms debounce prevents excessive save operations
- **Caret Tracking**: Position updates throttled for smooth scrolling

### Lazy Loading:
- **Plugin Loading**: Chart and UML plugins loaded on-demand
- **Syntax Highlighting**: Language-specific highlighting loaded as needed

### Memory Management:
- **Event Cleanup**: `componentWillUnmount` removes global listeners
- **Editor Disposal**: Proper @toast-ui/editor cleanup on component unmount

## Integration Points

### VS Code API Integration:
- **Font Settings**: Inherits `editor.fontSize`, `editor.fontFamily` from VS Code
- **Theme Synchronization**: Automatic light/dark theme detection
- **Focus Management**: Responds to VS Code window focus events

### File System Bridge:
- **Content Loading**: Receives file content via postMessage
- **Auto-save**: Triggers extension file write operations
- **Image Processing**: Coordinates with extension for image file operations

### Keyboard Shortcut Handling:
- **Command Execution**: Receives VS Code command executions via messages
- **Custom Shortcuts**: Integrated with VS Code's keybinding system
- **Mode Switching**: Toggle between WYSIWYG and markdown views
