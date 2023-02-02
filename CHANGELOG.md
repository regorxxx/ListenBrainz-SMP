# Changelog

## [Table of Contents]
- [Unreleased](#unreleased)
- [1.0.0](#100---2022-10-01)

## [Unreleased][]
### Added
- SMP Dynamic menu: new config to expose menus as SMP main menu entries (which can be run via CMD, standard native buttons, etc.).
- UI: added icons-only mode for toolbar buttons at the toolbar configuration menu ('Other UI configuration'). Tooltip is adjusted to show the button's name there instead. Handy when creating a compact toolbar and icons are good enough to recognize the tools.
### Changed
- Buttons: default method of installation requires now to load the toolbar (no more single buttons support), from there, any button can be loaded as desired.
- Buttons: the buttons bar now shows a message when no buttons have been added, left clicking shows a popup with available buttons presets. Right clicking opens the menu to configure the toolbar or add buttons manually.
### Removed
### Fixed
- UI: don't show tooltip during buttons drag n drop.
- UI: background color mismatch when resizing windows and using custom background colors.

## [1.0.0] - 2022-10-01
### Added
- First release.
### Changed
### Removed
### Fixed

[Unreleased]: https://github.com/regorxxx/ListenBrainz-SMP/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/regorxxx/ListenBrainz-SMP/compare/3c4f2d0...v1.0.0