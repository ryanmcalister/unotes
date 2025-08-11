# Updates

## [1.5.3] - 2025-08-10

### Changed

- Updated backend dependencies from legacy versions to modern, Node.js 20+ compatible versions.

## [1.5.2] - 2023-01-01

### Fixed

- Editor crashes when tables have selections

### Added

- Error reporting on markdown setting
- Safeguards to prevent wrong file writes

## [1.5.0] - 2022-11-03

### Changed

- tui-editor version to 3.2 (contributed by kiyoka)

### Fixed

- Indent resetting [(issue: #81)](https://github.com/ryanmcalister/unotes/issues/81)
- Action bar color theme [(issue: #91)](https://github.com/ryanmcalister/unotes/issues/91)
- Writing <br> Creates text and new paragraph [(issue: #121)](https://github.com/ryanmcalister/unotes/issues/121)
- Auto scroll function broken [(issue: #138)](https://github.com/ryanmcalister/unotes/issues/138)

- Cursor jumping to beginning of file [(issue: #113)](https://github.com/ryanmcalister/unotes/issues/113) (contributed by kiyoka)
- [(issue: #118)](https://github.com/ryanmcalister/unotes/issues/118) (contributed by kiyoka)
- [(issue: #127)](https://github.com/ryanmcalister/unotes/issues/127) (contributed by kiyoka)

### Added
- inline Katex support
- support for `${workspaceFolder}` var in `unotes.rootPath` [(issue: #101)](https://github.com/ryanmcalister/unotes/issues/101) 
- set focus keyboard shortcut [(issue: #144)](https://github.com/ryanmcalister/unotes/issues/144)
- `unotes.editor.extraFocus` setting

### Removed
- code block Katex support
- 2x toolbar display setting

### Known Issues
- custom theme colors are not completely working

## [1.4.4] - 2022-08-30

### Fixed

- Image duplication when dragging and dropping images from media folder [(issue: #133)](https://github.com/ryanmcalister/unotes/issues/133) (contributed by kiyoka)
- Adding an image may reencode it [(issue: #93)](https://github.com/ryanmcalister/unotes/issues/93) (contributed by kiyoka)

### Added

- Global image max width support added [(issue: #130)](https://github.com/ryanmcalister/unotes/issues/130) [(issue: #110)](https://github.com/ryanmcalister/unotes/issues/110) (contributed by kiyoka)

## [1.4.3] - 2022-08-05

### Added

- Global image max width support added [(issue: #130)](https://github.com/ryanmcalister/unotes/issues/130) [(issue: #110)](https://github.com/ryanmcalister/unotes/issues/110) (contributed by kiyoka)

## [1.4.2] - 2022-07-25

### Added

- Open markdown file in Unotes menu item [(issue: #123)](https://github.com/ryanmcalister/unotes/issues/123)
- Absolute path support for media folder [(issue: #119)](https://github.com/ryanmcalister/unotes/issues/119) (contributed by kiyoka)

## [1.4.1] - 2022-01-31

### Fixed

- Media folder creating when pasting images

## [1.4.0] - 2022-01-20

### Added

- Template notes
- Better support for remote/virtual usage (WSL, SSH)

## [1.3.1] - 2021-05-21

### Updated

- Remark updated to v13 and support added for front matter (contributed by codeofpi)

## [1.3.0] - 2021-03-04

### Added

- KaTeX math code block rendering [(issue: #7)](https://github.com/ryanmcalister/unotes/issues/7)
- VSCode editor font settings now supported [(issue: #98)](https://github.com/ryanmcalister/unotes/issues/98)

## [1.2.2] - 2021-02-27

### Added

- Updated tui-editor to v2.5.1

### Fixed

- Unotes works without open folder if root folder setting set [(issue: #8)](https://github.com/ryanmcalister/unotes/issues/8) (contributed by ReshefElisha)
- Unotes uses first folder if multiple project folders open (contributed by ReshefElisha)

## [1.2.1] - 2020-10-16

### Added

- `mdCodeBlockBackground`, `mdHighlightText`, `mdTableText` theme colors

### Fixed

- Startup / resizing flickering window

## [1.2.0] - 2020-10-01

### Added

- Support for YAML front matter [(issue: #67)](https://github.com/ryanmcalister/unotes/issues/67)
- Update tui-editor to v2.4.0

## [1.1.8] - 2020-08-11

### Fixed

- Broken local image display on Linux/Mac [(issue: #82)](https://github.com/ryanmcalister/unotes/issues/82)

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
