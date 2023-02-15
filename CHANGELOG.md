# Changelog

## [Table of Contents]
- [Unreleased](#unreleased)
- [1.1.0](#110---2023-02-15)
- [1.0.0](#100---2022-10-01)

## [Unreleased][]
### Added
### Changed
### Removed
### Fixed

## [1.1.0] - 2023-02-15
### Added
- SMP Dynamic menu: new config to expose menus as SMP main menu entries (which can be run via CMD, standard native buttons, etc.).
- UI: added icons-only mode for toolbar buttons at the toolbar configuration menu ('Other UI configuration'). Tooltip is adjusted to show the button's name there instead. Handy when creating a compact toolbar and icons are good enough to recognize the tools.
### Changed
- Buttons: default method of installation requires now to load the toolbar (no more single buttons support), from there, any button can be loaded as desired.
- Buttons: the buttons bar now shows a message when no buttons have been added, left clicking shows a popup with available buttons presets. Right clicking opens the menu to configure the toolbar or add buttons manually.
- UI: unified tooltip structure and available info on all buttons (short description + relevant settings + keyboard modifiers).
- UI: unified buttons size normalization settings and behavior for all axis modes. 
- UI: unified button icon alignment on reflow modes.
### Removed
### Fixed
- UI: don't show tooltip during buttons drag n drop.
- UI: background color mismatch when resizing windows and using custom background colors.
- UI: fixed reflow mode in some cases when resizing back to the required width/height to show all buttons on a single row/column.
- UI: fixed reflow mode in some cases when normalization mode was not active and buttons had different size; non needed empty space was added in some rows/columns.

## [1.0.0] - 2022-10-01
### Added
- First release.
### Changed
### Removed
### Fixed

[Unreleased]: https://github.com/regorxxx/ListenBrainz-SMP/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/regorxxx/ListenBrainz-SMP/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/regorxxx/ListenBrainz-SMP/compare/3c4f2d0...v1.0.0