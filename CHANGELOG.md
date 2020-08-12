# Updates

## [1.1.8] - 2020-08-11

### Fixed

- Broken local image display on Linux/Mac [(issue: #26)](https://github.com/ryanmcalister/unotes/issues/82)

## [1.1.7] - 2020-04-23

### Fixed

- Editor to auto-close when note in editor deleted

### Added

- Files and folders sent to system trash instead of hard deletes

## [1.1.6] - 2020-04-20

### Fixed

- Hotkeys not working in editor with new VSCode

## [1.1.5] - 2020-01-24

### Fixed

- Removed deprecated use of vscode rootPath

### Added

- New color configuration option for markdown list sub item level 3
- New 'mediaFolder' configuration option for setting where images are saved
- Updated tui-editor to v1.4.10

## [1.1.4] - 2019-10-24

### Fixed

- Incorrect wysiwyg color configuration option names (contributed by nitsuj33)

## [1.1.3] - 2019-10-17

### Fixed

- Virtual folder paths not working in Windows

### Added

- New 'noteFileExtension' configuration option for setting how notes are filtered and saved
- New 'toggleMode' command and hotkey
- Updated tui-editor to v1.4.7
- Dependency on glob package

## [1.1.1] - 2019-10-08

### Fixed

- Bug when auto-converting pasted images

## [1.1.0] - 2019-10-03

### Fixed

- Bad scroll positions when switching documents

### Added

- New `convertPastedImages` configuration option to auto-convert pasted or dropped images to local files in .media
- New `convertImages` command to convert all embedded images in a document to local files in .media
- Scroll positions remembered for each document in each view during Unote sessions
- Note and folder renaming [(issue: #26)](https://github.com/ryanmcalister/unotes/issues/26)

## [1.0.15] - 2019-08-19

### Fixed

- Remark angle bracket links always changed to bracket links

### Added

- rootPath workspace setting to set a notes root folder path [(issue: #18)](https://github.com/ryanmcalister/unotes/issues/18) (contributed by epaezrubio)
- Refresh treeview command and button (contributed by epaezrubio)
- Custom color options for wysiwyg and markdown editor [(issue: #2)](https://github.com/ryanmcalister/unotes/issues/2)
- Updated tui-editor to v1.4.6
- Contributing guide
- Code of conduct

## [1.0.14] - 2019-07-27

### Fixed

- Race condition causing first open document to sometimes be erased

### Added

- Auto-formatting options using [remark-stringify](https://github.com/remarkjs/remark/tree/master/packages/remark-stringify)
- Updated tui-editor to v1.4.5

## [1.0.8] - 2019-05-22

### Fixed

- Mac retina / HDPI display issue

## [1.0.6] - 2019-05-10

### Added

- Warnings for workspace folder issues
- New user setting 'unotes.editor.display2x' to render buttons larger for HDPI screens
- Enabled WYSIWYG in-document search

### Fixed

- UTF8 encoding bug (fixes issue #6)

## [1.0.4] - 2019-04-02

### Fixed

- Ordering first item bug

## [1.0.0] - 2019-03-29

### Added

- Project improvements

## [0.1.9] - 2019-03-22

### Added

- Folder ordering option
- New icons

## [0.1.8] - 2019-03-16

### Added

- Improved theming

## [0.1.7] - 2019-03-15

### Added

- Improved light theming
- Note ordering

## [0.1.6] - 2019-03-08

### Added

- Remove file and folder to context menu
- Add file and folder from context menu

### Fixed

- View closed on deleted file
- Removed text color extension

## [0.1.5] - 2019-03-04

### Fixed

- Window resizing

## [0.1.4] - 2019-03-01

### Added

- File and folder commands

## [0.1.3] - 2019-02-25

### Added

- Relative path image support
- Tab titles
- Save debounce delay when editing

## [0.1.2] - 2019-02-18

### Added

- Hotkey mappings

## [0.1.1] - 2019-02-11

### Added

- Dark theme support

## [0.1.0] - 2019-02-04

### Fixed

- Tab switching bug
