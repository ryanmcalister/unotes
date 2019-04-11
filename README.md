<p align="center">
  <br />
  <a title="Learn more about Unotes" href="https://github.com/ryanmcalister/unotes"><img src="https://raw.githubusercontent.com/ryanmcalister/unotes/master/resources/unotes-icon.png" alt="Unotes Logo" /></a></p>

# ᑌᑎotes Markdown WYSIWYG
> Unotes gives you a `markdown` note editor right inside Visual Studio Code. Don't get distracted with noisy markdown syntax. **Enjoy** your notes with a rich `WYSIWYG` editor. Take full control of the markdown when needed. Start taking notes in **_style_**!  

![Intro](https://raw.githubusercontent.com/ryanmcalister/unotes/master/resources/screenshots/intro.gif)

# ♥
If find Unotes useful, please [write a review](https://marketplace.visualstudio.com/items?itemName=ryanmcalister.Unotes&ssr=false#review-details). 

# What's new in Unotes 1.0
- Folder options for alphabetical or manual note ordering
- Local image support

# ᑌᑎotes
Unotes is an [open-source](https://github.com/ryanmcalister/unotes 'Open Unotes on GitHub') extension for [Visual Studio Code](https://code.visualstudio.com) created by [Ryan McAlister](https://github.com/ryanmcalister 'Learn more about Ryan').

Unotes helps you visualize and manage your markdown notes. Organize your notes in nested folders and edit them with a rich WYSIWYG editor. 

Use Visual Studio Code's `built-in` search and version control features for all your notes.

# Features

### WYSIWYG Editor

![Editor](https://raw.githubusercontent.com/ryanmcalister/unotes/master/resources/screenshots/wysiwyg.gif)

### Split Markdown / Preview View

![Buttons](https://raw.githubusercontent.com/ryanmcalister/unotes/master/resources/screenshots/buttons.gif)

![Split View](https://raw.githubusercontent.com/ryanmcalister/unotes/master/resources/screenshots/split.gif)

### Color Themes Supported

![Themes](https://raw.githubusercontent.com/ryanmcalister/unotes/master/resources/screenshots/themes.gif)

### Note Ordering

![Ordering](https://raw.githubusercontent.com/ryanmcalister/unotes/master/resources/screenshots/ordering.gif)

### Editing Toolbar

### Paste Images from the Clipboard

### Local, Embedded and URL Images

### Table Support

### Customizable Hotkeys
| Command | Default |
| ------- | ------- |
| Heading 1 | Ctrl + Alt + 1 |
| Heading 2 | Ctrl + Alt + 2 |
| Heading 3 | Ctrl + Alt + 3 |
| Heading 4 | Ctrl + Alt + 4 |
| Heading 5 | Ctrl + Alt + 5 |
| Heading 6 | Ctrl + Alt + 6 |
| Normal | Ctrl + Alt + 0 |
| Bold | Ctrl + Alt + b |
| Italic | Ctrl + Alt + i |
| Strike | Ctrl + Alt + s |
| Task | Ctrl + Alt + t |
| Unordered List | Ctrl + Alt + u |
| Ordered List | Ctrl + Alt + o |
| BlockQuote | Ctrl + Alt + q |
| Inline Code (highlight) | Ctrl + Alt + h |
| Code Block | Ctrl + Alt + c |
| Horizontal Line | Ctrl + Alt + l |

## Syncing Note Files
- All note files are stored as `.md` files
- Sync to a repository using `Git` or other version control system
- Folder and Note settings are stored in `.unotes/unotes_meta.json` 
  - **Be sure to sync this file** to preserver note ordering

## Additional Info
### Excluded Folders
The following folders are excluded from the Unotes navigation tree:
- `node_modules/**`
- `.*` (folders starting with '`.`')

## Known Issues
No markdown WYSIWYG is perfect and Unotes has its share of issues. Some issues have been inherited from the current dependencies. Hopefully some of these will be resolved in the near future...

#### Copy and Paste 
- You may not always get the desired results when pasting directly into the WYSIWYG editor. In some cases it may be best to paste into the raw markdown view.

#### Unicode
- Some unicode characters may not be preserved well in the editor.

#### CodeBlocks
- Some characters are escape encoded undesireably.

## Acknowlegments
Unotes is here largely thanks to
- [tui editor](https://github.com/nhnent/tui.editor)
