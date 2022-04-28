<p align="center">
  <br />
  <a title="Learn more about Unotes" href="https://github.com/ryanmcalister/unotes"><img src="https://raw.githubusercontent.com/ryanmcalister/unotes/master/resources/unotes-icon.png" alt="Unotes Logo" /></a></p>

[![https://marketplace.visualstudio.com/items?itemName=ryanmcalister.Unotes](https://vsmarketplacebadge.apphb.com/version/ryanmcalister.unotes.svg)](https://marketplace.visualstudio.com/items?itemName=ryanmcalister.Unotes)
[![](https://vsmarketplacebadge.apphb.com/installs-short/ryanmcalister.unotes.svg)](https://marketplace.visualstudio.com/items?itemName=ryanmcalister.Unotes)

# ᑌᑎotes Markdown WYSIWYG

> Unotes gives you a `markdown` note editor right inside Visual Studio Code. Don't get distracted with noisy markdown syntax. **Enjoy your notes** with a rich **WYSIWYG** editor. Take full control of the markdown when needed. Start taking notes in **_style_**!

![Intro](https://raw.githubusercontent.com/ryanmcalister/unotes/master/resources/screenshots/intro.gif)

# ♥

If you find Unotes useful, please [write a review](https://marketplace.visualstudio.com/items?itemName=ryanmcalister.Unotes&ssr=false#review-details).

or

[Donate](https://www.buymeacoffee.com/ryanmcalister)


# What's new in Unotes 1.4

- [Template Notes!](#template-notes)
- Better support for remote file connections. (WSL/SSH)
- '`Open In Unotes`' right-click menu option added

# ᑌᑎotes

Unotes is an [open-source](https://github.com/ryanmcalister/unotes "Open Unotes on GitHub") extension for [Visual Studio Code](https://code.visualstudio.com) created by [Ryan McAlister](https://github.com/ryanmcalister "Learn more about Ryan").

Unotes helps you visualize and manage your markdown notes. Organize your notes in nested folders and edit them with a rich WYSIWYG editor.

Use Visual Studio Code's built-in search and version control features for all your notes.

# FAIR WARNING

- Unotes **will reformat** your markdown without warning.
- It will not preserve special formatting.
- It auto-saves all edits.

It is **highly recommended** to use unotes with **source control** to revert any unwanted changes.

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

By default images are embedded as base64 text objects. Images can optionally be auto-converted to local files when pasted. See [Image convertion to local files](#workspace-configuration-options).

### Local, Embedded and URL Images

Local Image Example

```md
![my picture](.media/test.png)
```

### Table Support

Use the table toolbar button to insert a table. Right-click on the table to open the table editing menu.

![TableMenu](https://raw.githubusercontent.com/ryanmcalister/unotes/master/resources/screenshots/tables.gif)

### Template Notes

Templates notes allow you to create a new note using a customizable template. Right-click in the note sidebar and select '`Add Template Note`' to choose from the available templates.

- Template files can be added to the `.unotes/templates` directory as `.hbs` ([handlebars](https://handlebarsjs.com/)) files.
- Template variables:
  - `title`
  - `date`
- Template helper functions:
  - `formatDate` - see [momentjs](https://momentjs.com/) for format options.
  - `capitalize`
  - `capitalizeAll`

A default template can also be set using the `newNoteTemplate` setting. This will apply the template by default without having to select from the list.

Template Example
```markdown
# {{capitalizeAll title}}

{{formatDate date "llll"}}

```


### Math Typesetting

- Only [KaTeX](https://katex.org) currently supported

#### KaTeX Example

```katex
\begin{aligned}
\int_0^12\frac{x^3(1-x)^3}{10+x^2}\,dx &=\frac{22}{17}-\pi\\ \\
\int_{-\infty}^\infty e^{-x^2}\,dx &=\sqrt{\pi}
\end{aligned}
```

![KaTeX](https://raw.githubusercontent.com/ryanmcalister/unotes/master/resources/screenshots/katex.png)


### Customizable Hotkeys

| Command                 | Default        |
| ----------------------- | -------------- |
| Heading 1               | Ctrl + Alt + 1 |
| Heading 2               | Ctrl + Alt + 2 |
| Heading 3               | Ctrl + Alt + 3 |
| Heading 4               | Ctrl + Alt + 4 |
| Heading 5               | Ctrl + Alt + 5 |
| Heading 6               | Ctrl + Alt + 6 |
| Normal                  | Ctrl + Alt + 0 |
| Bold                    | Ctrl + Alt + b |
| Italic                  | Ctrl + Alt + i |
| Strike                  | Ctrl + Alt + s |
| Task                    | Ctrl + Alt + t |
| Unordered List          | Ctrl + Alt + u |
| Ordered List            | Ctrl + Alt + o |
| BlockQuote              | Ctrl + Alt + q |
| Inline Code (highlight) | Ctrl + Alt + h |
| Code Block              | Ctrl + Alt + c |
| Horizontal Line         | Ctrl + Alt + l |
| Toggle Mode             | Ctrl + Alt + m |

### Formatting Options (Experimental)

Unotes can automatically reformat your markdown if desired using [remark-stringify](https://github.com/remarkjs/remark/tree/master/packages/remark-stringify). To enable this feature, add a 'remark_settings.json' file to the .unotes folder in your
project directory. All [remark-stringify](https://github.com/remarkjs/remark/tree/master/packages/remark-stringify) options can be used.

**Note - This feature is experimental and has some known issues.**

#### Additional Remark Settings Options

- `listItemSpace`
    - sets the number of spaces after a list marker
    - only works when listItemIndent = 'tab'
- `listItemTabSize`
    - sets the list item tab size (default = 4)

#### Example remark_settings.json

```JavaScript
    {
        "gfm": true,
        "commonmark": false,
        "pedantic": false,
        "looseTable": false,
        "spacedTable": true,
        "paddedTable": true,
        "fence": "`",
        "fences": true,
        "bullet": "-",
        "listItemIndent": "tab",
        "listItemSpace": 1,
        "listItemTabSize": 4,
        "incrementListMarker": true,
        "rule": "-",
        "ruleRepetition": 3,
        "ruleSpaces": false,
        "strong": "*",
        "emphasis": "_"
    }
```

### YAML Front Matter Support

Unotes now supports the YAML front matter sections in tui-editor 2.0. Note this will not work when using markdown reformatting with `remark` (see above).

#### Example

```yaml
---
title: title
---
```

## Workspace Configuration Options

| Setting                           | Description                                                                                                                                                                             |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| unotes.editor.display2X           | Display the button toolbar at twice the size                                                                                                                                            |
| unotes.editor.convertPastedImages | Automatically convert pasted images to local image files in a .media folder                                                                                                             |
| unotes.mediaFolder                | The folder where pasted or converted images will be saved. Relative to the note.                                                                                                        |
| unotes.newNoteTemplate               | The template used for new notes. Set to empty for no note template.               |
| unotes.noteFileExtension          | The file extension used to filter and save note files. Default = '.md'                                                                                                                  |
| unotes.rootPath                   | The root folder path for the note files.<br>Setting this value will turn off auto-tracking of external file changes.<br>If needed you can click the 'Refresh' button on the notes tree. |

## Font Customization

Unotes now uses the VSCode `editor.font-size`, `editor.font-family` and `editor.font-weight` settings.

## Custom Colors

Custom colors can be set to override many of the themed or default color values. Note there are separate values for the wysywig, markdown editor and markdown preview panes.

You can set options in the vscode workspace settings.json file:

```
"workbench.colorCustomizations": 
{ 
    "unotes.wysText": "#998", 
    "unotes.mdHeader": "#333", 
    "unotes.pvCodeKeyword": "#3e4d75"
}
```

### Color Options

| Color Name             | Description                              |
| ---------------------- | ---------------------------------------- |
| wysText                | Unotes wysiwyg text                      |
| wysH1                  | Unotes wysiwyg heading 1                 |
| wysH2                  | Unotes wysiwyg heading 2                 |
| wysH3H4                | Unotes wysiwyg heading 3 and 4           |
| wysH5H6                | Unotes wysiwyg heading 5 and 6           |
| wysBlockquote          | Unotes wysiwyg blockquote                |
| wysCodeBlockBackground | Unotes wysiwyg code block background     |
| wysCodeBlockText       | Unotes wysiwyg code block text           |
| wysHighlight           | Unotes wysiwyg highlight / inline code   |
| wysTableText           | Unotes wysiwyg table text                |
| wysTableTdBorder       | Unotes wysiwyg table cell border         |
| wysTableThBorder       | Unotes wysiwyg table header border       |
| wysTableThBackground   | Unotes wysiwyg table header background   |
| wysTableThText         | Unotes wysiwyg table header text         |
| wysList                | Unotes wysiwyg list text                 |
| wysLink                | Unotes wysiwyg link                      |
| wysLinkHover           | Unotes wysiwyg hover link                |
| mdText                 | Unotes markdown text                     |
| mdSelectedBackground   | Unotes markdown selected text background |
| mdHeader               | Unotes markdown header                   |
| mdListSub1             | Unotes markdown list sub item 1          |
| mdListSub2             | Unotes markdown list sub item 2          |
| mdListSub3             | Unotes markdown list sub item 3          |
| mdCodeBlockText        | Unotes markdown codeblock text           |
| mdCodeBlockBackground  | Unotes markdown codeblock background     |
| mdHighlightText        | Unotes markdown highlight text           |
| mdCodeBlockText        | Unotes markdown codeblock text           |
| mdTableText            | Unotes markdown table text               |
| pvCodeComment          | Unotes preview code comment              |
| pvCodeText             | Unotes preview code text                 |
| pvCodeKeyword          | Unotes preview code keyword              |
| pvCodeNumber           | Unotes preview code number               |
| pvCodeString           | Unotes preview code string               |
| pvCodeType             | Unotes preview code type                 |
| pvCodeDeletion         | Unotes preview code deletion             |
| pvCodeAddition         | Unotes preview code addition             |
| pvCodeTitle            | Unotes preview code title                |

## Syncing Note Files

- All note files are stored as `.md` files by default. This is [configurable.](#workspace-configuration-options) 
- Sync to a repository using `Git` or other version control system
- Folder and Note settings are stored in `.unotes/unotes_meta.json`
    - **Be sure to sync this file** to preserve note orderings

## Additional Info

### Excluded Folders

The following folders are excluded from the Unotes navigation tree:

- `node_modules/**`
- `.*` (folders starting with '`.`')

## Known Issues

No markdown WYSIWYG is perfect and Unotes has its share of issues. Some issues have been inherited from the current dependencies. Hopefully some of these will be resolved in the near future...

#### Copy and Paste

- You may not always get the desired results when pasting directly into the WYSIWYG editor. In some cases it may be best to paste into the raw markdown view.
- You can paste into the WYSIWYG editor as plain text if the shift key is down. This can be done by adding an additional keybinding in `vscode` for `paste`. (e.g. '`CTRL + SHIFT + v`')

#### CodeBlocks

- Some characters are escape encoded undesireably.

#### Open Workspace Folder

- Before using Unotes you must have a folder currently opened in the workspace.

#### Multiple Workspace Folder Not Supported

- Unotes currently does not support multiple workspace folders open. This may be a future enhancement.

## Acknowlegments

Unotes is here largely thanks to

- [tui editor](https://github.com/nhnent/tui.editor)
